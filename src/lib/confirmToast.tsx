import Swal from 'sweetalert2';

export const confirmToast = (
  message: string,
  onConfirm: () => void,
  onCancel?: () => void,
) => {
  void Swal.fire({
    title: 'Confirm Action',
    text: message,
    icon: 'warning',
    position: 'center',
    width: 'min(92vw, 420px)',
    padding: '1.25rem',
    showCancelButton: true,
    confirmButtonText: 'OK',
    cancelButtonText: 'Cancel',
    reverseButtons: true,
    buttonsStyling: true,
    backdrop: 'rgba(15, 23, 42, 0.28)',
    allowOutsideClick: true,
    customClass: {
      popup: 'rounded-2xl',
      title: 'text-lg font-black text-slate-800',
      htmlContainer: 'text-sm font-semibold leading-5 text-slate-600',
      confirmButton: 'rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold',
      cancelButton: 'rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-600',
      actions: 'w-full gap-2',
    },
  }).then((result) => {
    if (result.isConfirmed) {
      onConfirm();
    } else {
      onCancel?.();
    }
  });
};