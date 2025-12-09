import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

export default function StripePaymentForm({ total, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/confirmation',
        },
        redirect: 'if_required',
      });

      if (error) {
        console.error('Payment error:', error);
        if (onError) onError(error.message);
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('Payment succeeded! Payment Intent ID:', paymentIntent.id);
        await onSuccess(paymentIntent.id);
      }
    } catch (err) {
      console.error('Payment processing error:', err);
      if (onError) onError(err.message);
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="stripe-payment-form">
      <PaymentElement />
      <button
        className="complete-order-btn stripe-pay-btn"
        disabled={!stripe || !elements || isProcessing}
        type="submit"
      >
        {isProcessing ? 'Processing...' : `Pay $${total.toFixed(2)}`}
      </button>
    </form>
  );
}
