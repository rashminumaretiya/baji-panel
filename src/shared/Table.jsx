import NoData from './NoData.jsx'
import Pagination from './Pagination.jsx'
import './table.scss'

export default function Table({
  columns = [],
  data = [],
  title,
  emptyMessage = 'No Data Found',
  rowKey,
  pagination,
}) {
  const hasData = Array.isArray(data) && data.length > 0

  const getRowKey = (row, index) => {
    if (typeof rowKey === 'function') return rowKey(row, index)
    if (typeof rowKey === 'string' && row?.[rowKey] != null) return row[rowKey]
    return index
  }

  const resolveCellClassName = (col, value, row) => {
    if (typeof col.cellClassName === 'function') {
      return col.cellClassName(value, row) || ''
    }
    return col.cellClassName || ''
  }

  return (
    <>
      {title && (
        <div className="d-flex justify-content-between align-items-center">
          <p className="page-title">{title}</p>
        </div>
      )}
      <table className="table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} scope="col">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hasData ? (
            data.map((row, rowIndex) => (
              <tr key={getRowKey(row, rowIndex)}>
                {columns.map((col) => {
                  const value = row?.[col.key]
                  const cellClassName = resolveCellClassName(col, value, row)
                  return (
                    <td
                      key={col.key}
                      className={cellClassName || undefined}
                    >
                      {col.render
                        ? col.render(value, row, rowIndex)
                        : value ?? ''}
                    </td>
                  )
                })}
              </tr>
            ))
          ) : (
            <tr>
              <td className="p-0" colSpan={columns.length}>
                <NoData message={emptyMessage} />
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {pagination && <Pagination {...pagination} />}
    </>
  )
}
