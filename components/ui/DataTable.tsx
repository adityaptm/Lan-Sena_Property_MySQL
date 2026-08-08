'use client';

import React, { useState } from 'react';
import { Search, Download, Printer, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import * as XLSX from 'xlsx';

export interface Column<T> {
  header: string;
  accessorKey: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  title?: string;
  searchPlaceholder?: string;
  exportFileName?: string;
  actions?: (row: T) => React.ReactNode;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  title,
  searchPlaceholder = 'Cari data...',
  exportFileName = 'Lansena_Export',
  actions,
  headerAction,
  footer,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumnIndex, setSortColumnIndex] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter search
  const filteredData = data.filter((row) => {
    if (!searchTerm) return true;
    return Object.values(row).some((val) =>
      String(val ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Sort
  const sortedData = [...filteredData].sort((a, b) => {
    if (sortColumnIndex === null) return 0;
    const col = columns[sortColumnIndex];
    if (!col || typeof col.accessorKey === 'function') return 0;

    const valA = a[col.accessorKey as keyof T];
    const valB = b[col.accessorKey as keyof T];

    if (valA == null) return 1;
    if (valB == null) return -1;

    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortDirection === 'asc' ? valA - valB : valB - valA;
    }

    return sortDirection === 'asc'
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA));
  });

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = sortedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (index: number) => {
    if (!columns[index].sortable) return;
    if (sortColumnIndex === index) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumnIndex(index);
      setSortDirection('asc');
    }
  };

  const handleExportCSV = () => {
    const exportData = filteredData.map((row) => {
      const obj: Record<string, any> = {};
      columns.forEach((col) => {
        if (typeof col.accessorKey !== 'function') {
          obj[col.header] = row[col.accessorKey as keyof T];
        }
      });
      return obj;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    XLSX.writeFile(workbook, `${exportFileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-md hover:bg-slate-50 text-sm font-medium transition-colors text-slate-700 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Print Data
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-md hover:bg-slate-50 text-sm font-medium transition-colors text-slate-700 shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
          {headerAction}
        </div>
      </div>

      {/* Print Only Header */}
      <div className="print-only mb-6">
        <div className="flex items-center gap-4 mb-4 border-b-2 border-black pb-4">
          <img src="/logo.jpg" alt="Logo" className="w-16 h-16 object-contain" />
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wide">PT. LAN SENA JAYA</h1>
            <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Property System</p>
          </div>
        </div>
        <h2 className="text-lg font-bold text-center mb-2">{title || exportFileName.replace(/_/g, ' ')}</h2>
        <p className="text-xs text-right mb-2">Dicetak pada: {new Date().toLocaleDateString('id-ID')}</p>
      </div>

      {/* Table Area */}
      <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-xs text-white bg-blue-600 uppercase font-semibold border-b border-blue-700 shadow-sm">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">#</th>
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    onClick={() => handleSort(idx)}
                    className={`px-4 py-3 ${
                      col.sortable ? 'cursor-pointer select-none hover:text-blue-100' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {col.header}
                      {col.sortable && (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-70" />
                      )}
                    </div>
                  </th>
                ))}
                {actions && <th className="py-3.5 px-4 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (actions ? 1 : 0)}
                    className="py-8 text-center text-slate-500 text-sm"
                  >
                    Data tidak ditemukan
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-blue-50 even:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-center text-slate-500 font-mono text-xs">
                      {(currentPage - 1) * pageSize + rowIdx + 1}
                    </td>
                    {columns.map((col, colIdx) => (
                      <td key={colIdx} className="py-3.5 px-4">
                        {typeof col.accessorKey === 'function'
                          ? col.accessorKey(row)
                          : (row[col.accessorKey as keyof T] as React.ReactNode)}
                      </td>
                    ))}
                    {actions && (
                      <td className="py-3.5 px-4 text-right space-x-2">
                        {actions(row)}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {footer}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600 bg-white p-4 border border-slate-200 rounded-md shadow-sm">
          <div>
            Menampilkan {(currentPage - 1) * pageSize + 1} - {Math.min((currentPage - 1) * pageSize + pageSize, sortedData.length)} dari {sortedData.length}
          </div>
          
          <div className="flex items-center gap-4">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-slate-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value={5}>5 per halaman</option>
              <option value={10}>10 per halaman</option>
              <option value={25}>25 per halaman</option>
              <option value={50}>50 per halaman</option>
            </select>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 bg-slate-50 rounded-md font-medium border border-slate-200 text-xs">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-md hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
