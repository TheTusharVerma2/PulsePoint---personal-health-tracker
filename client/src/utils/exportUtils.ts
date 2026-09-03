import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export function exportActivitiesCSV(activities: any[]) {
  if (!activities || activities.length === 0) return;

  const headers = ['Type', 'Date', 'Duration (min)', 'Calories Burned (kcal)', 'Steps'];
  const rows = activities.map(a => [
    `"${a.type}"`,
    `"${new Date(a.date).toLocaleDateString()}"`,
    a.duration_minutes || 0,
    a.calories_burned || 0,
    a.steps || 0
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `PulsePoint_Activity_Log_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportNutritionCSV(nutrition: any[]) {
  if (!nutrition || nutrition.length === 0) return;

  const headers = ['Meal Name', 'Date', 'Calories (kcal)', 'Protein (g)', 'Carbs (g)', 'Fat (g)'];
  const rows = nutrition.map(n => [
    `"${n.meal_name}"`,
    `"${new Date(n.date).toLocaleDateString()}"`,
    n.calories || 0,
    n.protein_g || 0,
    n.carbs_g || 0,
    n.fat_g || 0
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `PulsePoint_Nutrition_Log_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function exportReportToPDF(elementId: string) {
  const element = document.getElementById(elementId);
  if (!element) return;

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#0f172a',
      logging: false,
      useCORS: true
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`PulsePoint_Health_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (err) {
    console.error('Failed to generate PDF report:', err);
  }
}
