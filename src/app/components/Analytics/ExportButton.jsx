'use client';
import { useRef } from 'react';
import html2canvas from 'html2canvas';
import pptxgen from 'pptxgenjs';

const ExportButton = () => {
  const dashboardRef = useRef();

  const exportToPPT = async () => {
    const ppt = new pptxgen();
    const slides = dashboardRef.current.querySelectorAll('.analytics-card');
    
    for (const slide of slides) {
      const canvas = await html2canvas(slide);
      ppt.addSlide({
        background: { color: 'F1F5F9' },
        addImage: { 
          data: canvas.toDataURL(), 
          x: 0.5, y: 0.5, 
          w: 9, h: 5.5 
        }
      });
    }
    
    ppt.writeFile('Ticket-System-Analytics.pptx');
  };

  return (
    <button 
      onClick={exportToPPT}
      className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Export to PowerPoint
    </button>
  );
};

export default ExportButton;