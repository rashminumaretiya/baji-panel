import NoData from './NoData.jsx'
import Pagination from './Pagination.jsx'

export default function Table({
  columns = [],
  data = [],
  title,
  tableTitle,
  tableTitleAs: TableTitleTag = 'h6',
  tableTitleClassName,
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
    <div>
      {title && (
        <div className="flex items-center justify-between">
          <p className="text-[#1e1e1e] font-bold text-[13px] leading-5 pt-1.5 mb-1.5">
            {title}
          </p>
        </div>
      )}
      {tableTitle && (
        <TableTitleTag
          className={`bg-[var(--text-color)] border-b border-[var(--sm-text-color)] text-white leading-6 font-bold px-2.5 mb-0 text-[12px] ${tableTitleClassName ?? ''}`}
        >
          {tableTitle}
        </TableTitleTag>
      )}
      <table className="w-full mb-4 border-collapse">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className="border-y border-[var(--sm-text-color)] bg-[var(--th-bg)] text-[var(--light-navy)] text-[12px] font-bold px-2.5 py-2 align-middle whitespace-nowrap text-left last:text-right"
              >
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
                      className={`border-t border-[var(--xs-gray)] px-2.5 py-2 align-middle bg-white text-[12px] text-[var(--dark)] text-left last:text-right ${cellClassName}`.trim()}
                    >
                      {col.render
                        ? col.render(value, row, rowIndex)
                        : (value ?? '')}
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
      {pagination && hasData && <Pagination {...pagination} />}
    </div>
  )
}
