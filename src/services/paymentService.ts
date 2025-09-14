const RAZORPAY_KEY_ID = 'rzp_test_sBBXgkZVrbaVaW';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export interface PaymentOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

export interface PaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

class PaymentService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Create a Razorpay order on the server
  async createOrder(amount: number, currency: string = 'INR', receipt?: string): Promise<PaymentOrder> {
    const amountInSmallestUnit = Math.floor(amount * 100);
    
    const response = await fetch(`${this.baseURL}/payments/create_order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountInSmallestUnit,
        currency,
        receipt: receipt || `receipt_${Date.now()}`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Initialize Razorpay checkout
  initializeRazorpay(order: PaymentOrder, options: {
    name: string;
    description: string;
    prefill?: {
      name?: string;
      email?: string;
      contact?: string;
    };
    notes?: Record<string, string>;
    callback_url?: string;
  }): Promise<PaymentResponse> {
    return new Promise((resolve, reject) => {
      // Load Razorpay script if not already loaded
      if (!(window as { Razorpay?: unknown }).Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => this.openRazorpayCheckout(order, options, resolve, reject);
        script.onerror = () => reject(new Error('Failed to load Razorpay'));
        document.head.appendChild(script);
      } else {
        this.openRazorpayCheckout(order, options, resolve, reject);
      }
    });
  }

  private openRazorpayCheckout(
    order: PaymentOrder,
    options: {
      name: string;
      description: string;
      prefill?: {
        name?: string;
        email?: string;
        contact?: string;
      };
      notes?: Record<string, string>;
      callback_url?: string;
    },
    resolve: (value: PaymentResponse) => void,
    reject: (reason: Error) => void
  ) {
    const rzpOptions = {
      key: RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: options.name,
      description: options.description,
      order_id: order.id,
      prefill: options.prefill || {},
      notes: options.notes || {},
      callback_url: options.callback_url,
      handler: (response: PaymentResponse) => {
        resolve(response);
      },
      modal: {
        ondismiss: () => {
          reject(new Error('Payment cancelled by user'));
        },
      },
      theme: {
        color: '#3399cc',
      },
    };

    const rzp = new ((window as unknown as { Razorpay: new (options: typeof rzpOptions) => { open: () => void } }).Razorpay)(rzpOptions);
    rzp.open();
  }

  // Verify payment signature
  async verifyPayment(paymentResponse: PaymentResponse): Promise<boolean> {
    const response = await fetch(`${this.baseURL}/payments/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentResponse),
    });

    if (!response.ok) {
      throw new Error('Payment verification failed');
    }

    const result: { verified: boolean } = await response.json();
    return result.verified;
  }

  // Get payment status
  async getPaymentStatus(paymentId: string): Promise<{
    payment_id: string;
    order_id: string;
    amount: number;
    currency: string;
    status: string;
    method: string;
    captured: boolean;
    created_at: number;
  }> {
    const response = await fetch(`${this.baseURL}/v1/payments/status?payment_id=${paymentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get payment status');
    }

    return response.json();
  }
}

export const paymentService = new PaymentService();
export default paymentService; 