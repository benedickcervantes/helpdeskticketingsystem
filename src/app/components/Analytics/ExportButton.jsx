'use client';
import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import pptxgen from 'pptxgenjs';
import { 
  FiDownload, 
  FiFile, 
  FiImage, 
  FiFileText, 
  FiPrinter,
  FiChevronDown,
  FiCheck,
  FiAlertCircle
} from 'react-icons/fi';

const ExportButton = () => {
  const dashboardRef = useRef();
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState(null);

  const exportToPPT = async () => {
    setIsExporting(true);
    setExportStatus({ type: 'ppt', message: 'Preparing PowerPoint export...' });
    
    try {
      const ppt = new pptxgen();
      const slides = dashboardRef.current.querySelectorAll('.analytics-card');
      
      for (const [index, slide] of slides.entries()) {
        setExportStatus({ type: 'ppt', message: `Processing slide ${index + 1} of ${slides.length}...` });
        const canvas = await html2canvas(slide);
        ppt.addSlide({
          background: { color: 'F8FAFC' },
          addImage: { 
            data: canvas.toDataURL(), 
            x: 0.5, y: 0.5, 
            w: 9, h: 5.5 
          }
        });
      }
      
      setExportStatus({ type: 'ppt', message: 'Finalizing export...' });
      await ppt.writeFile('Ticket-System-Analytics.pptx');
      
      setExportStatus({ type: 'success', message: 'PowerPoint exported successfully!' });
      setTimeout(() => setExportStatus(null), 3000);
    } catch (error) {
      setExportStatus({ type: 'error', message: 'Export failed. Please try again.' });
      console.error('PPT Export Error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPNG = async () => {
    setIsExporting(true);
    setExportStatus({ type: 'png', message: 'Exporting as PNG...' });
    
    try {
      const canvas = await html2canvas(dashboardRef.current);
      const link = document.createElement('a');
      link.download = 'dashboard-snapshot.png';
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setExportStatus({ type: 'success', message: 'PNG exported successfully!' });
      setTimeout(() => setExportStatus(null), 3000);
    } catch (error) {
      setExportStatus({ type: 'error', message: 'PNG export failed. Please try again.' });
      console.error('PNG Export Error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    setExportStatus({ type: 'pdf', message: 'Preparing PDF export...' });
    
    try {
      const { jsPDF } = await import('jspdf');
      const canvas = await html2canvas(dashboardRef.current);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('dashboard-report.pdf');
      
      setExportStatus({ type: 'success', message: 'PDF exported successfully!' });
      setTimeout(() => setExportStatus(null), 3000);
    } catch (error) {
      setExportStatus({ type: 'error', message: 'PDF export failed. Please try again.' });
      console.error('PDF Export Error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const printDashboard = () => {
    setExportStatus({ type: 'print', message: 'Preparing for printing...' });
    
    const printContent = dashboardRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Dashboard</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; }
            .analytics-card { margin-bottom: 20px; break-inside: avoid; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <h1>Ticket System Analytics Report</h1>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
          <div>${printContent}</div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
      setExportStatus({ type: 'success', message: 'Printing completed!' });
      setTimeout(() => setExportStatus(null), 3000);
    }, 250);
  };

  const exportOptions = [
    {
      id: 'powerpoint',
      label: 'PowerPoint',
      icon: <FiFile size={16} />,
      action: exportToPPT,
      description: 'Export as PowerPoint presentation'
    },
    {
      id: 'pdf',
      label: 'PDF',
      icon: <FiFileText size={16} />,
      action: exportToPDF,
      description: 'Export as PDF document'
    },
    {
      id: 'image',
      label: 'PNG Image',
      icon: <FiImage size={16} />,
      action: exportToPNG,
      description: 'Export as PNG image'
    },
    {
      id: 'print',
      label: 'Print',
      icon: <FiPrinter size={16} />,
      action: printDashboard,
      description: 'Print dashboard report'
    }
  ];

  return (
    <>
      <div className="relative inline-block">
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isExporting}
          className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <FiDownload size={18} />
          <span>Export Report</span>
          <FiChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
              <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 px-3 py-2">
                  Export Options
                </h3>
              </div>
              <div className="p-2">
                {exportOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      option.action();
                      setIsOpen(false);
                    }}
                    disabled={isExporting}
                    className="w-full flex items-center gap-3 px-3 py-3 text-left rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="text-blue-600 dark:text-blue-400">
                      {option.icon}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {option.label}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {option.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Status Indicator */}
      {exportStatus && (
        <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 max-w-sm z-50 flex items-start gap-3">
          {exportStatus.type === 'success' ? (
            <div className="bg-green-100 dark:bg-green-900/30 p-1.5 rounded-full">
              <FiCheck className="text-green-600 dark:text-green-400" size={16} />
            </div>
          ) : exportStatus.type === 'error' ? (
            <div className="bg-red-100 dark:bg-red-900/30 p-1.5 rounded-full">
              <FiAlertCircle className="text-red-600 dark:text-red-400" size={16} />
            </div>
          ) : (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          )}
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {exportStatus.type === 'success' ? 'Success' : 
               exportStatus.type === 'error' ? 'Error' : 'Exporting...'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {exportStatus.message}
            </p>
          </div>
          <button 
            onClick={() => setExportStatus(null)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ×
          </button>
        </div>
      )}

      {/* Hidden dashboard reference for export */}
      <div ref={dashboardRef} className="hidden">
        {/* This would contain your actual dashboard components */}
        <div className="analytics-card">Ticket Status Distribution</div>
        <div className="analytics-card">Resolution Time Analytics</div>
        <div className="analytics-card">Performance Metrics</div>
        <div className="analytics-card">Ticket Trends</div>
      </div>
    </>
  );
};

export default ExportButton;