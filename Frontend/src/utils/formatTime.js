export function formatMessageTime(dateString) {
  const date = new Date(dateString);
  const hours = padZero(date.getHours());
  const minutes = padZero(date.getMinutes());
  const day = padZero(date.getDate());
  const month = padZero(date.getMonth() + 1);
  const year = date.getFullYear();

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function padZero(number) {
  return number.toString().padStart(2, "0");
}
