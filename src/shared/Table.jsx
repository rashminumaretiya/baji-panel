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
          <p className="mb-1.5 pt-1.5 text-[13px] leading-5 font-bold text-[#1e1e1e]">
            {title}
          </p>
        </div>
      )}
      {tableTitle && (
        <TableTitleTag
          className={`mb-0 border-b border-(--sm-text-color) bg-(--text-color) px-2.5 text-[12px] leading-6 font-bold text-white ${tableTitleClassName ?? ''}`}
        >
          {tableTitle}
        </TableTitleTag>
      )}
      <table className="mb-4 w-full border-collapse">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className="border-y border-(--sm-text-color) bg-(--th-bg) px-2.5 py-2 text-left align-middle text-[12px] font-bold whitespace-nowrap text-(--light-navy) last:text-right"
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
                      className={`border-t border-(--xs-gray) bg-white px-2.5 py-2 text-left align-middle text-[12px] text-(--dark) last:text-right ${cellClassName}`.trim()}
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
