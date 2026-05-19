// Lightweight port mirroring the Angular Alert service (uses SweetAlert2).
import Swal from 'sweetalert2'

function toast(icon, text) {
  return Swal.fire({
    toast: true,
    position: 'top-end',
    icon,
    title: text,
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  })
}

export const alertService = {
  success: (msg) => toast('success', msg),
  error: (msg) => toast('error', msg),
  info: (msg) => toast('info', msg),
  warning: (msg) => toast('warning', msg),
}
