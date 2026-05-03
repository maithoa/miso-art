const STATUS_STYLES = {
  order_received: 'bg-gray-100 text-gray-700',
  payment_confirmed: 'bg-yellow-100 text-yellow-800',
  order_confirmed: 'bg-blue-100 text-blue-800',
  sent: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-700',
};

const STATUS_LABELS = {
  order_received: 'Received',
  payment_confirmed: 'Payment Confirmed',
  order_confirmed: 'Confirmed',
  sent: 'Sent',
  cancelled: 'Cancelled',
};

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || 'bg-gray-100 text-gray-700';
  const label = STATUS_LABELS[status] || status;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>
      {label}
    </span>
  );
}
