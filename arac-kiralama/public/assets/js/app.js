document.addEventListener('input', (event) => {
  const form = event.target.closest('form');
  if (!form || !form.querySelector('[name="pickup_at"]') || !form.querySelector('[name="return_at"]')) return;
  const pickup = form.querySelector('[name="pickup_at"]').value;
  const returns = form.querySelector('[name="return_at"]').value;
  if (!pickup || !returns) return;
  const days = Math.max(1, Math.ceil((new Date(returns) - new Date(pickup)) / 86400000));
  form.dataset.days = String(days);
});
