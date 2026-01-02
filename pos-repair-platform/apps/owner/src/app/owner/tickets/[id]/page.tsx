'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ticketsApi, employeesApi } from '@/lib/api';
import { ArrowLeft, Save, MessageSquare } from 'lucide-react';
import type { Ticket as TicketType, Employee, TicketStatus } from '@/lib/types';
import { toast } from 'sonner';
import Link from 'next/link';

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;
  const [ticket, setTicket] = useState<TicketType | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState('');
  const [formData, setFormData] = useState({
    status: 'RECEIVED' as TicketStatus,
    technicianId: '',
  });

  useEffect(() => {
    if (ticketId) {
      loadData();
    }
  }, [ticketId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ticketData, employeesData] = await Promise.all([
        ticketsApi.findOne(ticketId),
        employeesApi.findAll().catch(() => []),
      ]);
      setTicket(ticketData);
      setFormData({
        status: ticketData.status,
        technicianId: ticketData.technicianId || '',
      });
    } catch (error) {
      console.error('Error loading ticket:', error);
      toast.error('Failed to load ticket');
      router.push('/owner/tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!ticket) return;
    try {
      setSaving(true);
      await ticketsApi.update(ticket.id, {
        status: formData.status,
        technicianId: formData.technicianId || undefined,
      });
      toast.success('Ticket updated successfully');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update ticket');
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!ticket || !note.trim()) return;
    try {
      await ticketsApi.addNote(ticket.id, note, 'INTERNAL');
      toast.success('Note added successfully');
      setNote('');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add note');
    }
  };

  const statusColors: Record<string, string> = {
    RECEIVED: 'bg-gray-100 text-gray-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    AWAITING_PARTS: 'bg-orange-100 text-orange-800',
    READY: 'bg-green-100 text-green-800',
    COMPLETED: 'bg-purple-100 text-purple-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="space-y-6">
        <Link href="/owner/tickets">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tickets
          </Button>
        </Link>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Ticket not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/owner/tickets">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tickets
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{ticket.title}</CardTitle>
              <Badge className={statusColors[ticket.status] || ''}>
                {ticket.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {ticket.description && (
              <div>
                <Label>Description</Label>
                <p className="text-sm text-muted-foreground mt-1">{ticket.description}</p>
              </div>
            )}
            {ticket.customer && (
              <div>
                <Label>Customer</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {ticket.customer.firstName} {ticket.customer.lastName}
                  {ticket.customer.email && ` • ${ticket.customer.email}`}
                  {ticket.customer.phone && ` • ${ticket.customer.phone}`}
                </p>
              </div>
            )}
            {ticket.total != null && (
              <div>
                <Label>Total</Label>
                <p className="text-sm font-medium mt-1">${Number(ticket.total).toFixed(2)}</p>
              </div>
            )}
            {ticket.createdAt && (
              <div>
                <Label>Created</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(ticket.createdAt).toLocaleString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Update Ticket</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as TicketStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RECEIVED">Received</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="AWAITING_PARTS">Awaiting Parts</SelectItem>
                  <SelectItem value="READY">Ready</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="technician">Technician</Label>
              <Select
                value={formData.technicianId || 'unassigned'}
                onValueChange={(value) => setFormData({ ...formData, technicianId: value === 'unassigned' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select technician" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {employees
                    .filter((emp) => emp.role === 'TECHNICIAN' || emp.role === 'MANAGER')
                    .map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
          <CardDescription>Add internal notes about this ticket</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="note">Add Note</Label>
            <Input
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Enter a note..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  handleAddNote();
                }
              }}
            />
          </div>
          <Button onClick={handleAddNote} disabled={!note.trim()}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Add Note
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

