import { Injectable, NotFoundException, ForbiddenException, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CreateTicketNoteDto } from './dto/create-ticket-note.dto';
import { UserPayload } from '../auth/types';
import { StoreRole, TicketStatus } from '@prisma/client';

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: UserPayload, createTicketDto: CreateTicketDto) {
    // All authenticated users can create tickets
    try {
      const ticketData: any = {
        storeId: user.storeId,
        title: createTicketDto.title,
        description: createTicketDto.description || undefined,
        status: createTicketDto.status || TicketStatus.RECEIVED,
        estimatedCost: createTicketDto.estimatedCost || undefined,
      };

      // Only add customerId if provided
      if (createTicketDto.customerId) {
        ticketData.customerId = createTicketDto.customerId;
      }

      // Only add technicianId if explicitly provided
      // Note: technicianId references Employee.id
      // Auto-assignment is handled separately after ticket creation
      if (createTicketDto.technicianId) {
        ticketData.technicianId = createTicketDto.technicianId;
      }

      // Only add scheduledAt if provided
      if (createTicketDto.scheduledAt) {
        ticketData.scheduledAt = new Date(createTicketDto.scheduledAt);
      }

      // Create ticket without includes first to avoid relation errors
      const ticket = await this.prisma.ticket.create({
        data: {
          ...ticketData,
          id: crypto.randomUUID(),
          updatedAt: new Date(),
        },
      });

      // Then fetch with relations if needed
      return this.prisma.ticket.findUnique({
        where: { id: ticket.id },
        include: {
          Customer: true,
          Store: {
            select: {
              id: true,
              name: true,
            },
          },
          Employee: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        } as any,
      });
    } catch (error: any) {
      console.error('Error creating ticket:', error);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error meta:', error.meta);
      
      // Handle Prisma errors
      if (error.code === 'P2002') {
        throw new BadRequestException('A ticket with this information already exists');
      }
      if (error.code === 'P2003') {
        throw new BadRequestException(`Invalid foreign key reference: ${error.meta?.field_name || 'customer, technician, or store not found'}`);
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('Record not found');
      }
      
      // Return more detailed error message
      const errorMessage = error.message || 'Unknown error';
      console.error('Full error stack:', error.stack);
      
      throw new HttpException(
        `Failed to create ticket: ${errorMessage}. Error code: ${error.code || 'N/A'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(user: UserPayload, status?: TicketStatus, technicianId?: string) {
    const where: any = {
      storeId: user.storeId,
    };

    // Filter by status if provided
    if (status) {
      where.status = status;
    }

    // Filter by technician if provided (OWNER/MANAGER/TECHNICIAN can filter)
    if (technicianId && (user.role === StoreRole.OWNER || user.role === StoreRole.MANAGER || user.role === StoreRole.TECHNICIAN)) {
      where.technicianId = technicianId;
    }

    return this.prisma.ticket.findMany({
      where,
      include: {
        Customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        Store: {
          select: {
            id: true,
            name: true,
          },
        },
        Employee: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      } as any,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(user: UserPayload, id: string) {
    const where: any = {
      id,
      storeId: user.storeId,
    };

    const ticket = await this.prisma.ticket.findFirst({
      where,
      include: {
        Customer: true,
        Store: {
          select: {
            id: true,
            name: true,
            storeEmail: true,
          },
        },
        Employee: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      } as any,
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket ${id} not found`);
    }

    return ticket;
  }

  async update(user: UserPayload, id: string, updateTicketDto: UpdateTicketDto) {
    // Check if ticket exists and user has access
    const existing = await this.prisma.ticket.findFirst({
      where: {
        id,
        storeId: user.storeId,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Ticket ${id} not found`);
    }

    // VIEWER and CASHIER cannot update tickets
    if (user.role === StoreRole.VIEWER || user.role === StoreRole.CASHIER) {
      throw new ForbiddenException('You do not have permission to update tickets');
    }

    const updateData: any = {};

    if (updateTicketDto.title !== undefined) updateData.title = updateTicketDto.title;
    if (updateTicketDto.description !== undefined) updateData.description = updateTicketDto.description;
    if (updateTicketDto.customerId !== undefined) updateData.customerId = updateTicketDto.customerId;
    if (updateTicketDto.estimatedCost !== undefined) updateData.estimatedCost = updateTicketDto.estimatedCost;
    if (updateTicketDto.subtotal !== undefined) updateData.subtotal = updateTicketDto.subtotal;
    if (updateTicketDto.tax !== undefined) updateData.tax = updateTicketDto.tax;
    if (updateTicketDto.total !== undefined) updateData.total = updateTicketDto.total;
    if (updateTicketDto.scheduledAt !== undefined) {
      updateData.scheduledAt = updateTicketDto.scheduledAt ? new Date(updateTicketDto.scheduledAt) : null;
    }

    // Handle technician assignment (OWNER/MANAGER/TECHNICIAN can assign)
    if (updateTicketDto.technicianId !== undefined) {
      if (user.role !== StoreRole.OWNER && user.role !== StoreRole.MANAGER && user.role !== StoreRole.TECHNICIAN) {
        throw new ForbiddenException('You do not have permission to assign technicians');
      }
      
      // Handle unassigning (empty string or null)
      if (!updateTicketDto.technicianId) {
        updateData.technicianId = null;
      } else {
        // Validate technician exists and belongs to the store before assigning
        try {
          const technician = await this.prisma.employee.findFirst({
            where: {
              id: updateTicketDto.technicianId,
              storeId: user.storeId,
            },
          });
          
          if (!technician) {
            throw new NotFoundException(`Technician with ID "${updateTicketDto.technicianId}" not found in your store`);
          }
          
          updateData.technicianId = updateTicketDto.technicianId;
        } catch (err: any) {
          // If it's already a NotFoundException, re-throw it
          if (err instanceof NotFoundException) {
            throw err;
          }
          // Otherwise, log and throw a more descriptive error
          console.error('Error validating technician:', err);
          throw new BadRequestException(`Invalid technician ID: ${updateTicketDto.technicianId}. The technician may not exist or may not belong to your store.`);
        }
      }
    }

    // Handle status changes with timestamps
    if (updateTicketDto.status !== undefined && updateTicketDto.status !== existing.status) {
      updateData.status = updateTicketDto.status;

      // Set timestamps based on status
      const now = new Date();
      if (updateTicketDto.status === TicketStatus.IN_PROGRESS && !existing.startedAt) {
        updateData.startedAt = now;
      } else if (updateTicketDto.status === TicketStatus.COMPLETED && !existing.completedAt) {
        updateData.completedAt = now;
      } else if (updateTicketDto.status === TicketStatus.CANCELLED && !existing.cancelledAt) {
        updateData.cancelledAt = now;
      }
    }

        try {
          return await this.prisma.ticket.update({
            where: { id },
            data: {
              ...updateData,
              updatedAt: new Date(),
            },
            include: {
              Customer: true,
              Store: {
                select: {
                  id: true,
                  name: true,
                },
              },
              Employee: {
                select: {
                  id: true,
                  name: true,
                  role: true,
                },
              },
            } as any,
          });
        } catch (error: any) {
          console.error('Error updating ticket:', error);
          console.error('Error message:', error.message);
          console.error('Error code:', error.code);
          console.error('Error meta:', error.meta);
          
          // Handle Prisma errors
          if (error.code === 'P2002') {
            throw new BadRequestException('A ticket with this information already exists');
          }
          if (error.code === 'P2003') {
            // P2003 is a foreign key constraint violation
            // The meta object contains information about which field failed
            const meta = error.meta || {};
            const fieldName = meta.field_name || meta.model_name || 'unknown field';
            const targetModel = meta.model_name || 'referenced record';
            
            // Log detailed error for debugging
            console.error('Foreign key constraint violation:', {
              fieldName,
              targetModel,
              fullMeta: meta,
              updateData: JSON.stringify(updateData, null, 2),
            });
            
            throw new BadRequestException(
              `Invalid reference: The ${fieldName} (${targetModel}) does not exist or does not belong to your store. Please check that the record exists.`
            );
          }
          if (error.meta?.target) {
            throw new BadRequestException(`Invalid foreign key reference: ${error.meta.target.join(', ')} not found`);
          }
          if (error.code === 'P2025') {
            throw new NotFoundException('Record not found');
          }
          
          // Return more detailed error message
          const errorMessage = error.message || 'Unknown error';
          console.error('Full error stack:', error.stack);
          
          throw new HttpException(
            `Failed to update ticket: ${errorMessage}. Error code: ${error.code || 'N/A'}`,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
  }

  async remove(user: UserPayload, id: string) {
    // OWNER, MANAGER, and TECHNICIAN can delete tickets
    if (user.role !== StoreRole.OWNER && user.role !== StoreRole.MANAGER && user.role !== StoreRole.TECHNICIAN) {
      throw new ForbiddenException('You do not have permission to delete tickets');
    }

    const ticket = await this.prisma.ticket.findFirst({
      where: {
        id,
        storeId: user.storeId,
      },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket ${id} not found`);
    }

    // Prevent deletion of completed tickets (or add soft delete)
    if (ticket.status === TicketStatus.COMPLETED) {
      throw new BadRequestException('Cannot delete completed tickets');
    }

    await this.prisma.ticket.delete({
      where: { id },
    });

    return { message: 'Ticket deleted successfully' };
  }

  async addNote(user: UserPayload, ticketId: string, createNoteDto: CreateTicketNoteDto) {
    // Check if ticket exists and user has access
    const ticket = await this.findOne(user, ticketId);

    // VIEWER cannot add notes
    if (user.role === StoreRole.VIEWER) {
      throw new ForbiddenException('You do not have permission to add notes');
    }

    return this.prisma.ticketNote.create({
      data: {
        id: crypto.randomUUID(),
        ticketId: ticket.id,
        authorId: user.employeeId,
        body: createNoteDto.body,
        visibility: createNoteDto.visibility || 'INTERNAL',
        updatedAt: new Date(),
      },
    });
  }

  async getNotes(user: UserPayload, ticketId: string) {
    // Check if ticket exists and user has access
    await this.findOne(user, ticketId);

    return this.prisma.ticketNote.findMany({
      where: {
        ticketId,
      },
      include: {},
      orderBy: { createdAt: 'desc' },
    });
  }
}

