export default function NoData({ message = 'No Data Found' }) {
  return (
    <div className="d-flex align-items-center no-data p-2">{message}</div>
  )
}
