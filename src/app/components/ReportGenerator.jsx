'use client';

import { useState, useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import PptxGenJS from 'pptxgenjs';

const ReportGenerator = ({ tickets, users, metrics, healthStatus, departmentPerformance }) => {
  const [selectedReportType, setSelectedReportType] = useState('executive');
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [chartsVisible, setChartsVisible] = useState(false);
  
  const chartRefs = {
    volumeChart: useRef(null),
    statusChart: useRef(null),
    priorityChart: useRef(null),
    departmentChart: useRef(null)
  };

  const reportTypes = [
    {
      id: 'executive',
      name: 'Executive Summary',
      description: 'High-level overview for C-level executives',
      icon: '👔',
      gradient: 'from-purple-600 to-blue-600'
    },
    {
      id: 'analytics',
      name: 'Analytics Overview',
      description: 'Comprehensive charts and data visualizations',
      icon: '📊',
      gradient: 'from-green-600 to-teal-600'
    },
    {
      id: 'operational',
      name: 'Performance Metrics',
      description: 'Detailed performance metrics and KPIs',
      icon: '⚙️',
      gradient: 'from-orange-600 to-red-600'
    },
    {
      id: 'departmental',
      name: 'Department Analysis',
      description: 'Department-wise performance breakdown',
      icon: '🏢',
      gradient: 'from-indigo-600 to-purple-600'
    },
    {
      id: 'trends',
      name: 'Trend Analysis',
      description: 'Historical trends and predictive insights',
      icon: '📈',
      gradient: 'from-pink-600 to-rose-600'
    },
    {
      id: 'compliance',
      name: 'Compliance Report',
      description: 'SLA compliance and audit trail',
      icon: '📋',
      gradient: 'from-cyan-600 to-blue-600'
    }
  ];

  const formatOptions = [
    { id: 'pdf', name: 'PDF Document', icon: '📄', description: 'Professional PDF with charts', color: 'bg-red-500' },
    { id: 'powerpoint', name: 'PowerPoint Presentation', icon: '📊', description: 'Executive presentation with visualizations', color: 'bg-orange-500' }
  ];

  const generateChartData = () => {
    // Ensure we have valid data
    const safeTickets = tickets || [];
    const safeUsers = users || [];
    const safeMetrics = metrics || {
      totalTickets: 0,
      resolutionRate: 0,
      avgResolutionTime: 0,
      customerSatisfaction: 0,
      criticalTickets: 0
    };

    const totalTickets = safeTickets.length;
    const openTickets = safeTickets.filter(t => t && t.status === 'open').length;
    const inProgressTickets = safeTickets.filter(t => t && t.status === 'in-progress').length;
    const resolvedTickets = safeTickets.filter(t => t && t.status === 'resolved').length;
    const criticalTickets = safeTickets.filter(t => t && t.priority === 'critical').length;
    const highPriorityTickets = safeTickets.filter(t => t && t.priority === 'high').length;
    const mediumPriorityTickets = safeTickets.filter(t => t && t.priority === 'medium').length;
    const lowPriorityTickets = safeTickets.filter(t => t && t.priority === 'low').length;

    // Department analytics
    const departmentStats = {};
    safeTickets.forEach(ticket => {
      if (ticket && ticket.createdBy) {
        const user = safeUsers.find(u => u && u.uid === ticket.createdBy);
        if (user && user.department) {
          if (!departmentStats[user.department]) {
            departmentStats[user.department] = { total: 0, resolved: 0, open: 0, inProgress: 0 };
          }
          departmentStats[user.department].total++;
          if (ticket.status === 'resolved') departmentStats[user.department].resolved++;
          if (ticket.status === 'open') departmentStats[user.department].open++;
          if (ticket.status === 'in-progress') departmentStats[user.department].inProgress++;
        }
      }
    });

    return {
      ticketVolume: [
        { name: 'Total', value: totalTickets || 0 },
        { name: 'Open', value: openTickets || 0 },
        { name: 'In Progress', value: inProgressTickets || 0 },
        { name: 'Resolved', value: resolvedTickets || 0 }
      ],
      statusDistribution: [
        { name: 'Open', value: openTickets || 0 },
        { name: 'In Progress', value: inProgressTickets || 0 },
        { name: 'Resolved', value: resolvedTickets || 0 }
      ],
      priorityDistribution: [
        { name: 'Critical', value: criticalTickets || 0 },
        { name: 'High', value: highPriorityTickets || 0 },
        { name: 'Medium', value: mediumPriorityTickets || 0 },
        { name: 'Low', value: lowPriorityTickets || 0 }
      ],
      departmentPerformance: Object.entries(departmentStats).map(([dept, stats]) => ({
        department: dept || 'Unknown',
        total: stats.total || 0,
        resolved: stats.resolved || 0,
        open: stats.open || 0,
        inProgress: stats.inProgress || 0,
        resolutionRate: stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0
      })).sort((a, b) => (b.total || 0) - (a.total || 0))
    };
  };

  const createSimpleChart = (data, type, title, colors) => {
    // Validate and sanitize data
    const safeData = (data || []).map(item => ({
      name: item?.name || 'Unknown',
      value: Number(item?.value) || 0
    })).filter(item => item.value >= 0);

    if (safeData.length === 0) {
      // Create a placeholder chart if no data
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(title, canvas.width / 2, 30);
      
      ctx.fillStyle = '#a0a0a0';
      ctx.font = '14px Arial';
      ctx.fillText('No data available', canvas.width / 2, canvas.height / 2);
      
      return canvas.toDataURL('image/png');
    }

    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas with dark background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title, canvas.width / 2, 30);
    
    if (type === 'bar') {
      // Create bar chart
      const barWidth = 60;
      const barSpacing = 100;
      const maxValue = Math.max(...safeData.map(d => d.value));
      const chartHeight = 250;
      const startY = 80;
      const startX = 100;
      
      safeData.forEach((item, index) => {
        const barHeight = maxValue > 0 ? (item.value / maxValue) * chartHeight : 0;
        const x = startX + (index * barSpacing);
        const y = startY + chartHeight - barHeight;
        
        // Draw bar
        ctx.fillStyle = colors[index] || '#10B981';
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Draw value
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(item.value.toString(), x + barWidth / 2, y - 5);
        
        // Draw label
        ctx.fillText(item.name, x + barWidth / 2, startY + chartHeight + 20);
      });
    } else if (type === 'pie') {
      // Create pie chart
      const centerX = canvas.width / 2;
      const centerY = 200;
      const radius = 80;
      let currentAngle = 0;
      const total = safeData.reduce((sum, item) => sum + item.value, 0);
      
      if (total > 0) {
        safeData.forEach((item, index) => {
          const sliceAngle = (item.value / total) * 2 * Math.PI;
          
          // Draw slice
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
          ctx.closePath();
          ctx.fillStyle = colors[index] || '#10B981';
          ctx.fill();
          
          // Draw label
          const labelAngle = currentAngle + sliceAngle / 2;
          const labelX = centerX + Math.cos(labelAngle) * (radius + 30);
          const labelY = centerY + Math.sin(labelAngle) * (radius + 30);
          
          ctx.fillStyle = '#ffffff';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`${item.name}: ${item.value}`, labelX, labelY);
          
          currentAngle += sliceAngle;
        });
      } else {
        // No data message
        ctx.fillStyle = '#a0a0a0';
        ctx.font = '14px Arial';
        ctx.fillText('No data available', centerX, centerY);
      }
    }
    
    return canvas.toDataURL('image/png');
  };

  const generatePDFReport = async (report) => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;

    const addText = (text, x, y, maxWidth, fontSize = 12, fontStyle = 'normal') => {
      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', fontStyle);
      const lines = pdf.splitTextToSize(text, maxWidth);
      pdf.text(lines, x, y);
      return y + (lines.length * fontSize * 0.4);
    };

    const checkNewPage = (requiredSpace) => {
      if (yPosition + requiredSpace > pageHeight - 20) {
        pdf.addPage();
        yPosition = 20;
        return true;
      }
      return false;
    };

    const addImage = async (imageData, x, y, width, height, title) => {
      if (imageData) {
        // Add chart title
        pdf.setTextColor(16, 185, 129);
        yPosition = addText(title, x, y, width, 14, 'bold');
        yPosition += 5;
        
        // Add chart image
        pdf.addImage(imageData, 'PNG', x, yPosition, width, height);
        return yPosition + height + 15;
      }
      return y;
    };

    // Title Page
    pdf.setFillColor(16, 185, 129);
    pdf.rect(0, 0, pageWidth, 30, 'F');
    
    pdf.setTextColor(255, 255, 255);
    yPosition = addText(report.title, 20, 20, pageWidth - 40, 20, 'bold');
    
    pdf.setTextColor(0, 0, 0);
    yPosition += 10;
    yPosition = addText(`Generated on: ${report.date}`, 20, yPosition, pageWidth - 40, 12);
    yPosition = addText(`Report Period: ${report.period}`, 20, yPosition, pageWidth - 40, 12);

    // Executive Summary
    pdf.addPage();
    yPosition = 20;
    pdf.setTextColor(16, 185, 129);
    yPosition = addText('EXECUTIVE SUMMARY', 20, yPosition, pageWidth - 40, 16, 'bold');
    
    pdf.setTextColor(0, 0, 0);
    yPosition += 10;
    
    if (report.summary) {
      const summaryData = [
        `Total Support Requests: ${report.summary.totalRequests || 0}`,
        `Resolution Rate: ${report.summary.resolutionRate || 0}%`,
        `Average Resolution Time: ${report.summary.avgResolutionTime || 0} hours`,
        `Customer Satisfaction: ${report.summary.customerSatisfaction || 0}%`,
        `Critical Issues: ${report.summary.criticalIssues || 0}`
      ];
      
      summaryData.forEach(item => {
        checkNewPage(15);
        yPosition = addText(`• ${item}`, 30, yPosition, pageWidth - 60, 12);
        yPosition += 5;
      });
    }

    // Charts Section
    if (report.charts) {
      yPosition += 15;
      checkNewPage(80);
      pdf.setTextColor(16, 185, 129);
      yPosition = addText('DATA VISUALIZATIONS', 20, yPosition, pageWidth - 40, 16, 'bold');
      
      pdf.setTextColor(0, 0, 0);
      yPosition += 10;

      // Create simple charts with safe data
      const chartImages = [
        createSimpleChart(report.charts.ticketVolume, 'bar', 'Ticket Volume Distribution', ['#3B82F6', '#EF4444', '#F59E0B', '#10B981']),
        createSimpleChart(report.charts.statusDistribution, 'pie', 'Status Distribution', ['#EF4444', '#F59E0B', '#10B981']),
        createSimpleChart(report.charts.priorityDistribution, 'pie', 'Priority Distribution', ['#EF4444', '#F59E0B', '#3B82F6', '#10B981']),
        createSimpleChart(report.charts.departmentPerformance, 'bar', 'Department Performance', ['#3B82F6', '#10B981'])
      ];

      const chartTitles = [
        'Ticket Volume Distribution',
        'Status Distribution',
        'Priority Distribution',
        'Department Performance'
      ];

      // Add charts to PDF
      for (let i = 0; i < chartImages.length; i++) {
        if (chartImages[i]) {
          checkNewPage(80);
          yPosition = await addImage(chartImages[i], 20, yPosition, pageWidth - 40, 60, chartTitles[i]);
        }
      }
    }

    // Health Status
    if (report.healthStatus) {
      yPosition += 15;
      checkNewPage(20);
      pdf.setTextColor(16, 185, 129);
      yPosition = addText('SUPPORT HEALTH STATUS', 20, yPosition, pageWidth - 40, 14, 'bold');
      
      pdf.setTextColor(0, 0, 0);
      yPosition += 5;
      yPosition = addText(`Status: ${report.healthStatus}`, 30, yPosition, pageWidth - 60, 12);
    }

    // Key Findings
    if (report.keyFindings) {
      yPosition += 15;
      checkNewPage(30);
      pdf.setTextColor(16, 185, 129);
      yPosition = addText('KEY FINDINGS', 20, yPosition, pageWidth - 40, 14, 'bold');
      
      pdf.setTextColor(0, 0, 0);
      yPosition += 5;
      report.keyFindings.forEach((finding, index) => {
        checkNewPage(15);
        yPosition = addText(`${index + 1}. ${finding}`, 30, yPosition, pageWidth - 60, 11);
        yPosition += 5;
      });
    }

    // Recommendations
    if (report.recommendations) {
      yPosition += 15;
      checkNewPage(30);
      pdf.setTextColor(16, 185, 129);
      yPosition = addText('RECOMMENDATIONS', 20, yPosition, pageWidth - 40, 14, 'bold');
      
      pdf.setTextColor(0, 0, 0);
      yPosition += 5;
      report.recommendations.forEach((rec, index) => {
        checkNewPage(15);
        yPosition = addText(`${index + 1}. ${rec}`, 30, yPosition, pageWidth - 60, 11);
        yPosition += 5;
      });
    }

    // Footer
    const totalPages = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 30, pageHeight - 10);
      pdf.text('Generated by HelpDesk Pro Executive Dashboard', 20, pageHeight - 10);
    }

    return pdf;
  };

  const generatePowerPointReport = async (report) => {
    const pptx = new PptxGenJS();
    
    pptx.author = 'HelpDesk Pro';
    pptx.company = 'IT Support Team';
    pptx.title = report.title;
    pptx.subject = 'IT Support Performance Report';

    // Title Slide
    const titleSlide = pptx.addSlide();
    titleSlide.background = { fill: 'F1F5F9' };
    
    titleSlide.addText(report.title, {
      x: 1, y: 2, w: 8, h: 1.5,
      fontSize: 28,
      bold: true,
      color: '10B981',
      align: 'center'
    });
    
    titleSlide.addText(`Generated on: ${report.date}`, {
      x: 1, y: 3.5, w: 8, h: 0.5,
      fontSize: 16,
      color: '64748B',
      align: 'center'
    });

    // Executive Summary Slide
    const summarySlide = pptx.addSlide();
    summarySlide.addText('Executive Summary', {
      x: 0.5, y: 0.5, w: 9, h: 0.8,
      fontSize: 24,
      bold: true,
      color: '10B981'
    });

    if (report.summary) {
      const summaryItems = [
        `Total Support Requests: ${report.summary.totalRequests || 0}`,
        `Resolution Rate: ${report.summary.resolutionRate || 0}%`,
        `Average Resolution Time: ${report.summary.avgResolutionTime || 0} hours`,
        `Customer Satisfaction: ${report.summary.customerSatisfaction || 0}%`,
        `Critical Issues: ${report.summary.criticalIssues || 0}`
      ];

      summaryItems.forEach((item, index) => {
        summarySlide.addText(`• ${item}`, {
          x: 0.5, y: 1.5 + (index * 0.4), w: 9, h: 0.3,
          fontSize: 14,
          color: '374151'
        });
      });
    }

    // Charts Slides
    if (report.charts) {
      // Create simple charts with safe data
      const chartImages = [
        createSimpleChart(report.charts.ticketVolume, 'bar', 'Ticket Volume Distribution', ['#3B82F6', '#EF4444', '#F59E0B', '#10B981']),
        createSimpleChart(report.charts.statusDistribution, 'pie', 'Status Distribution', ['#EF4444', '#F59E0B', '#10B981']),
        createSimpleChart(report.charts.priorityDistribution, 'pie', 'Priority Distribution', ['#EF4444', '#F59E0B', '#3B82F6', '#10B981']),
        createSimpleChart(report.charts.departmentPerformance, 'bar', 'Department Performance', ['#3B82F6', '#10B981'])
      ];

      const chartTitles = [
        'Ticket Volume Analysis',
        'Status Distribution',
        'Priority Distribution',
        'Department Performance'
      ];

      // Create slides for each chart
      for (let i = 0; i < chartImages.length; i++) {
        if (chartImages[i]) {
          const chartSlide = pptx.addSlide();
          chartSlide.addText(chartTitles[i], {
            x: 0.5, y: 0.5, w: 9, h: 0.8,
            fontSize: 24,
            bold: true,
            color: '10B981'
          });
          chartSlide.addImage({ 
            data: chartImages[i], 
            x: 1, 
            y: 1.5, 
            w: 8, 
            h: 4.5 
          });
        }
      }
    }

    // Key Findings Slide
    if (report.keyFindings) {
      const findingsSlide = pptx.addSlide();
      findingsSlide.addText('Key Findings', {
        x: 0.5, y: 0.5, w: 9, h: 0.8,
        fontSize: 24,
        bold: true,
        color: '10B981'
      });

      report.keyFindings.forEach((finding, index) => {
        findingsSlide.addText(`${index + 1}. ${finding}`, {
          x: 0.5, y: 1.5 + (index * 0.5), w: 9, h: 0.4,
          fontSize: 12,
          color: '374151'
        });
      });
    }

    // Recommendations Slide
    if (report.recommendations) {
      const recommendationsSlide = pptx.addSlide();
      recommendationsSlide.addText('Strategic Recommendations', {
        x: 0.5, y: 0.5, w: 9, h: 0.8,
        fontSize: 24,
        bold: true,
        color: '10B981'
      });

      report.recommendations.forEach((rec, index) => {
        recommendationsSlide.addText(`${index + 1}. ${rec}`, {
          x: 0.5, y: 1.5 + (index * 0.5), w: 9, h: 0.4,
          fontSize: 12,
          color: '374151'
        });
      });
    }

    return pptx;
  };

  const generateExecutiveReport = () => {
    const charts = generateChartData();
    return {
      title: 'IT Support Executive Summary Report',
      date: new Date().toLocaleDateString(),
      period: 'Last 30 Days',
      summary: {
        totalRequests: metrics?.totalTickets || 0,
        resolutionRate: metrics?.resolutionRate || 0,
        avgResolutionTime: metrics?.avgResolutionTime || 0,
        customerSatisfaction: metrics?.customerSatisfaction || 0,
        criticalIssues: metrics?.criticalTickets || 0
      },
      healthStatus: healthStatus?.status || 'Unknown',
      charts: charts,
      keyFindings: [
        `Support team handled ${metrics?.totalTickets || 0} requests with ${metrics?.resolutionRate || 0}% resolution rate`,
        `Average resolution time of ${metrics?.avgResolutionTime || 0} hours`,
        `${metrics?.criticalTickets || 0} critical issues requiring immediate attention`,
        `Customer satisfaction at ${metrics?.customerSatisfaction || 0}%`
      ],
      recommendations: [
        (metrics?.resolutionRate || 0) < 80 ? 'Improve resolution rate through additional training' : 'Maintain excellent resolution performance',
        (metrics?.avgResolutionTime || 0) > 48 ? 'Implement process improvements to reduce resolution time' : 'Resolution times are within acceptable range',
        (metrics?.criticalTickets || 0) > 0 ? 'Address critical issues immediately to prevent business disruption' : 'No critical issues requiring immediate attention'
      ]
    };
  };

  const generateAnalyticsReport = () => {
    const charts = generateChartData();
    return {
      title: 'IT Support Analytics Overview Report',
      date: new Date().toLocaleDateString(),
      period: 'Last 30 Days',
      summary: {
        totalRequests: metrics?.totalTickets || 0,
        resolutionRate: metrics?.resolutionRate || 0,
        avgResolutionTime: metrics?.avgResolutionTime || 0,
        customerSatisfaction: metrics?.customerSatisfaction || 0,
        criticalIssues: metrics?.criticalTickets || 0
      },
      healthStatus: healthStatus?.status || 'Unknown',
      charts: charts,
      keyFindings: [
        `Total ticket volume: ${metrics?.totalTickets || 0} requests processed`,
        `Status distribution: ${Math.round(((charts.ticketVolume[3]?.value || 0)/(metrics?.totalTickets || 1))*100)}% resolved, ${Math.round(((charts.ticketVolume[1]?.value || 0)/(metrics?.totalTickets || 1))*100)}% open`,
        `Priority breakdown: ${charts.priorityDistribution[0]?.value || 0} critical, ${charts.priorityDistribution[1]?.value || 0} high priority`,
        `Department analysis covers ${charts.departmentPerformance?.length || 0} departments`,
        `Top performing department: ${charts.departmentPerformance[0]?.department || 'N/A'}`
      ],
      recommendations: [
        'Monitor daily ticket volume trends for capacity planning',
        'Focus on reducing open ticket backlog',
        'Implement priority-based routing for critical issues',
        'Share best practices from top-performing departments',
        'Analyze resolution time patterns for process improvements'
      ]
    };
  };

  const generatePerformanceReport = () => {
    const charts = generateChartData();
    return {
      title: 'IT Support Performance Metrics Report',
      date: new Date().toLocaleDateString(),
      period: 'Last 30 Days',
      summary: {
        totalRequests: metrics?.totalTickets || 0,
        resolutionRate: metrics?.resolutionRate || 0,
        avgResolutionTime: metrics?.avgResolutionTime || 0,
        customerSatisfaction: metrics?.customerSatisfaction || 0,
        criticalIssues: metrics?.criticalTickets || 0
      },
      healthStatus: healthStatus?.status || 'Unknown',
      charts: charts,
      keyFindings: [
        `Performance metrics show ${metrics?.totalTickets || 0} total requests processed`,
        `Resolution rate of ${metrics?.resolutionRate || 0}% indicates operational efficiency`,
        `Average resolution time of ${metrics?.avgResolutionTime || 0} hours`,
        `Critical issues count: ${metrics?.criticalTickets || 0}`,
        `Department performance varies from ${Math.min(...(charts.departmentPerformance?.map(d => d.resolutionRate) || [0]))}% to ${Math.max(...(charts.departmentPerformance?.map(d => d.resolutionRate) || [0]))}%`
      ],
      recommendations: [
        'Monitor daily ticket volume trends for capacity planning',
        'Implement automated routing for improved efficiency',
        'Regular training sessions for support team members',
        'Focus on departments with lower resolution rates',
        'Implement SLA monitoring and alerting'
      ]
    };
  };

  const generateDepartmentalReport = () => {
    const charts = generateChartData();
    return {
      title: 'Department Performance Analysis Report',
      date: new Date().toLocaleDateString(),
      period: 'Last 30 Days',
      summary: {
        totalRequests: metrics?.totalTickets || 0,
        resolutionRate: metrics?.resolutionRate || 0,
        avgResolutionTime: metrics?.avgResolutionTime || 0,
        customerSatisfaction: metrics?.customerSatisfaction || 0,
        criticalIssues: metrics?.criticalTickets || 0
      },
      healthStatus: healthStatus?.status || 'Unknown',
      charts: charts,
      keyFindings: [
        `Department analysis covers ${charts.departmentPerformance?.length || 0} departments`,
        `Top performing department: ${charts.departmentPerformance[0]?.department || 'N/A'} with ${charts.departmentPerformance[0]?.resolutionRate || 0}% resolution rate`,
        `Average department resolution rate: ${Math.round((charts.departmentPerformance?.reduce((sum, d) => sum + (d.resolutionRate || 0), 0) || 0) / (charts.departmentPerformance?.length || 1))}%`,
        `Department with highest volume: ${charts.departmentPerformance?.sort((a,b) => (b.total || 0) - (a.total || 0))[0]?.department || 'N/A'}`,
        `Performance gap: ${Math.max(...(charts.departmentPerformance?.map(d => d.resolutionRate) || [0])) - Math.min(...(charts.departmentPerformance?.map(d => d.resolutionRate) || [0]))}% between best and worst performing departments`
      ],
      recommendations: [
        'Share best practices from top-performing departments',
        'Provide additional support to underperforming departments',
        'Implement department-specific training programs',
        'Create department performance dashboards',
        'Regular department performance reviews'
      ]
    };
  };

  const generateTrendsReport = () => {
    const charts = generateChartData();
    return {
      title: 'IT Support Trend Analysis Report',
      date: new Date().toLocaleDateString(),
      period: 'Last 30 Days',
      summary: {
        totalRequests: metrics?.totalTickets || 0,
        resolutionRate: metrics?.resolutionRate || 0,
        avgResolutionTime: metrics?.avgResolutionTime || 0,
        customerSatisfaction: metrics?.customerSatisfaction || 0,
        criticalIssues: metrics?.criticalTickets || 0
      },
      healthStatus: healthStatus?.status || 'Unknown',
      charts: charts,
      keyFindings: [
        `Trend analysis based on ${metrics?.totalTickets || 0} requests over the reporting period`,
        `Current resolution rate of ${metrics?.resolutionRate || 0}% shows ${(metrics?.resolutionRate || 0) >= 90 ? 'excellent' : (metrics?.resolutionRate || 0) >= 80 ? 'good' : 'room for improvement'} performance`,
        `Average resolution time of ${metrics?.avgResolutionTime || 0} hours is ${(metrics?.avgResolutionTime || 0) <= 24 ? 'excellent' : (metrics?.avgResolutionTime || 0) <= 48 ? 'acceptable' : 'needs improvement'}`,
        `Critical issues represent ${Math.round(((charts.priorityDistribution[0]?.value || 0)/(metrics?.totalTickets || 1))*100)}% of total volume`,
        `Department performance trends show ${charts.departmentPerformance?.length || 0} departments with varying performance levels`
      ],
      recommendations: [
        'Implement trend monitoring dashboards',
        'Set up automated alerts for performance degradation',
        'Conduct regular trend analysis reviews',
        'Develop predictive models for capacity planning',
        'Create trend-based performance improvement plans'
      ]
    };
  };

  const generateComplianceReport = () => {
    const charts = generateChartData();
    return {
      title: 'SLA Compliance & Audit Report',
      date: new Date().toLocaleDateString(),
      period: 'Last 30 Days',
      summary: {
        totalRequests: metrics?.totalTickets || 0,
        resolutionRate: metrics?.resolutionRate || 0,
        avgResolutionTime: metrics?.avgResolutionTime || 0,
        customerSatisfaction: metrics?.customerSatisfaction || 0,
        criticalIssues: metrics?.criticalTickets || 0
      },
      healthStatus: healthStatus?.status || 'Unknown',
      charts: charts,
      keyFindings: [
        `SLA compliance analysis for ${metrics?.totalTickets || 0} requests`,
        `Resolution rate compliance: ${(metrics?.resolutionRate || 0) >= 90 ? 'Compliant' : 'Non-compliant'} (${metrics?.resolutionRate || 0}% vs 90% target)`,
        `Response time compliance: ${(metrics?.avgResolutionTime || 0) <= 48 ? 'Compliant' : 'Non-compliant'} (${metrics?.avgResolutionTime || 0}h vs 48h target)`,
        `Critical issues compliance: ${(charts.priorityDistribution[0]?.value || 0) <= 5 ? 'Compliant' : 'Non-compliant'} (${charts.priorityDistribution[0]?.value || 0} critical issues)`,
        `Department compliance varies across ${charts.departmentPerformance?.length || 0} departments`
      ],
      recommendations: [
        'Implement automated SLA monitoring',
        'Regular compliance reviews and reporting',
        'Process improvements for non-compliant areas',
        'Department-specific SLA targets',
        'Compliance training for support teams'
      ]
    };
  };

  const generateReport = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    
    try {
      let report;
      switch (selectedReportType) {
        case 'executive':
          report = generateExecutiveReport();
          break;
        case 'analytics':
          report = generateAnalyticsReport();
          break;
        case 'operational':
          report = generatePerformanceReport();
          break;
        case 'departmental':
          report = generateDepartmentalReport();
          break;
        case 'trends':
          report = generateTrendsReport();
          break;
        case 'compliance':
          report = generateComplianceReport();
          break;
        default:
          report = generateExecutiveReport();
      }
      
      setGenerationProgress(30);
      
      if (selectedFormat === 'pdf') {
        const pdf = await generatePDFReport(report);
        setGenerationProgress(80);
        pdf.save(`${report.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      } else if (selectedFormat === 'powerpoint') {
        const pptx = await generatePowerPointReport(report);
        setGenerationProgress(80);
        await pptx.writeFile({ fileName: `${report.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pptx` });
      }
      
      setGenerationProgress(100);
      
      setTimeout(() => {
        setIsGenerating(false);
        setGenerationProgress(0);
      }, 1000);
      
    } catch (error) {
      console.error('Error generating report:', error);
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 mb-2">
            Executive Report Generator
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Create professional reports with comprehensive charts and visualizations designed for executive presentations.
          </p>
        </div>

        {/* Report Type Selection */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/30 shadow-xl">
          <h2 className="text-xl font-semibold mb-6 text-gray-300">Select Report Type</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {reportTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedReportType(type.id)}
                className={`p-6 rounded-xl border text-left transition-all duration-300 transform hover:scale-[1.02] ${
                  selectedReportType === type.id
                    ? `border-transparent bg-gradient-to-r ${type.gradient} shadow-lg`
                    : 'border-gray-700 bg-gray-700/30 hover:border-gray-600'
                }`}
              >
                <div className="text-3xl mb-3">{type.icon}</div>
                <h3 className="font-semibold text-white mb-2">{type.name}</h3>
                <p className="text-sm text-gray-300">{type.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Format Selection */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/30 shadow-xl">
          <h3 className="text-lg font-semibold text-gray-300 mb-4">Select Report Format</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {formatOptions.map((format) => (
              <button
                key={format.id}
                onClick={() => setSelectedFormat(format.id)}
                className={`p-4 rounded-xl border text-left transition-all duration-300 ${
                  selectedFormat === format.id
                    ? `border-transparent ${format.color} text-white shadow-lg`
                    : 'border-gray-700 bg-gray-700/30 text-gray-300 hover:border-gray-600'
                }`}
              >
                <div className="text-2xl mb-2">{format.icon}</div>
                <h4 className="font-semibold mb-1">{format.name}</h4>
                <p className="text-sm opacity-80">{format.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Report Preview */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/30 shadow-xl">
          <h3 className="text-lg font-semibold text-gray-300 mb-4">
            {reportTypes.find(t => t.id === selectedReportType)?.name} Preview
          </h3>
          
          <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-white mb-3 flex items-center">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></span>
                  Key Metrics
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm bg-gray-800/30 p-3 rounded-lg">
                    <span className="text-gray-400">Total Requests:</span>
                    <span className="font-semibold text-white">{metrics?.totalTickets || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm bg-gray-800/30 p-3 rounded-lg">
                    <span className="text-gray-400">Resolution Rate:</span>
                    <span className="font-semibold text-emerald-400">{metrics?.resolutionRate || 0}%</span>
                  </div>
                  <div className="flex justify-between text-sm bg-gray-800/30 p-3 rounded-lg">
                    <span className="text-gray-400">Avg Resolution Time:</span>
                    <span className="font-semibold text-white">{metrics?.avgResolutionTime || 0}h</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-3 flex items-center">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full mr-2"></span>
                  Charts Included
                </h4>
                <div className="space-y-2">
                  <div className="text-sm text-gray-300 bg-gray-800/30 p-3 rounded-lg">• Ticket Volume Distribution</div>
                  <div className="text-sm text-gray-300 bg-gray-800/30 p-3 rounded-lg">• Status Distribution</div>
                  <div className="text-sm text-gray-300 bg-gray-800/30 p-3 rounded-lg">• Priority Breakdown</div>
                  <div className="text-sm text-gray-300 bg-gray-800/30 p-3 rounded-lg">• Department Performance</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex justify-center">
          <button
            onClick={generateReport}
            disabled={isGenerating}
            className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group"
          >
            <span className="relative z-10">
              {isGenerating ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-3"></div>
                  <span>Generating {selectedFormat.toUpperCase()} Report... {generationProgress}%</span>
                </div>
              ) : (
                `Generate & Download ${selectedFormat.toUpperCase()} Report`
              )}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>

        {/* Progress Bar */}
        {isGenerating && (
          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${generationProgress}%` }}
            ></div>
          </div>
        )}

        {/* Report Features */}
        <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 rounded-2xl p-6 border border-cyan-700/30 shadow-xl">
          <h3 className="text-lg font-semibold text-cyan-300 mb-4">Report Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start p-3 bg-cyan-900/20 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-cyan-700/30 flex items-center justify-center mr-3 flex-shrink-0">
                <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-cyan-100">Robust Data Handling</h4>
                <p className="text-sm text-cyan-400/80">Safe handling of undefined or missing data</p>
              </div>
            </div>
            <div className="flex items-start p-3 bg-cyan-900/20 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-cyan-700/30 flex items-center justify-center mr-3 flex-shrink-0">
                <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-cyan-100">Professional Formats</h4>
                <p className="text-sm text-cyan-400/80">PDF and PowerPoint with embedded chart images</p>
              </div>
            </div>
            <div className="flex items-start p-3 bg-cyan-900/20 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-cyan-700/30 flex items-center justify-center mr-3 flex-shrink-0">
                <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-cyan-100">Error-Free Generation</h4>
                <p className="text-sm text-cyan-400/80">Comprehensive validation prevents crashes</p>
              </div>
            </div>
            <div className="flex items-start p-3 bg-cyan-900/20 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-cyan-700/30 flex items-center justify-center mr-3 flex-shrink-0">
                <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-cyan-100">Ready for Presentation</h4>
                <p className="text-sm text-cyan-400/80">Formatted for board meetings and executive reviews</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportGenerator;