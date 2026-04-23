import { projectId, publicAnonKey } from './supabase/info.tsx';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-e3e3d1af`;

interface Deal {
  id: string;
  dealName: string;
  borrower: string;
  status: 'Pending' | 'Funded' | 'Declined';
  loanAmountReceived: number;
  repaymentAmountDue: number;
  grossInterest: number;
  issuer: string;
  amountIssued: number;
  borrowerInfo: any;
  metrics: any;
  recommendation: any;
  createdAt: string;
  updatedAt: string;
}

export async function saveDeal(deal: Partial<Deal>): Promise<{ success: boolean; dealId?: string; deal?: Deal; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/deals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({
        ...deal,
        createdAt: deal.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to save deal');
    }

    return { ...data, dealId: data.id || data.dealId };
  } catch (error) {
    console.error('Error saving deal:', error);
    return { success: false, error: String(error) };
  }
}

export async function getAllDeals(): Promise<{ success: boolean; deals?: Deal[]; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/deals`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch deals');
    }

    return data;
  } catch (error) {
    console.error('Error fetching deals:', error);
    return { success: false, error: String(error) };
  }
}

export async function getDeal(id: string): Promise<{ success: boolean; deal?: Deal; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/deals/${id}`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch deal');
    }

    return data;
  } catch (error) {
    console.error('Error fetching deal:', error);
    return { success: false, error: String(error) };
  }
}

export async function updateDeal(id: string, updates: Partial<Deal>): Promise<{ success: boolean; deal?: Deal; error?: string }> {
  try {
    console.log('[API] updateDeal called with ID:', id);
    console.log('[API] updateDeal URL:', `${API_BASE_URL}/deals/${id}`);
    console.log('[API] updateDeal payload:', updates);
    
    const response = await fetch(`${API_BASE_URL}/deals/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({
        ...updates,
        updatedAt: new Date().toISOString(),
      }),
    });

    console.log('[API] Response status:', response.status);
    const data = await response.json();
    console.log('[API] Response data:', data);
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update deal');
    }

    return data;
  } catch (error) {
    console.error('[API] Error updating deal:', error);
    return { success: false, error: String(error) };
  }
}

export async function deleteDeal(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/deals/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete deal');
    }

    return data;
  } catch (error) {
    console.error('Error deleting deal:', error);
    return { success: false, error: String(error) };
  }
}

// Notification API functions
export async function sendPaymentReminder(params: {
  dealId: string;
  borrowerEmail: string;
  borrowerName: string;
  amountDue: number;
  dueDate: string;
}): Promise<{ success: boolean; notificationId?: string; message?: string; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/payment-reminder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to send payment reminder');
    }

    return data;
  } catch (error) {
    console.error('Error sending payment reminder:', error);
    return { success: false, error: String(error) };
  }
}

export async function sendStatusChangeNotification(params: {
  dealId: string;
  borrowerEmail: string;
  borrowerName: string;
  oldStatus: string;
  newStatus: string;
  dealName: string;
}): Promise<{ success: boolean; notificationId?: string; message?: string; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/status-change`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to send status change notification');
    }

    return data;
  } catch (error) {
    console.error('Error sending status change notification:', error);
    return { success: false, error: String(error) };
  }
}

export async function getAllNotifications(): Promise<{ success: boolean; notifications?: any[]; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch notifications');
    }

    return data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { success: false, error: String(error) };
  }
}