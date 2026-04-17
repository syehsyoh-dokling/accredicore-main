import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = pdfWorker;

export class PdfDocumentService {
  static async extractText(file: File): Promise<{ content: string; title?: string }> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await getDocument({ data: arrayBuffer }).promise;
      const pages: string[] = [];

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item) => ('str' in item ? item.str : ''))
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (pageText) {
          pages.push(pageText);
        }
      }

      const content = pages.join('\n\n').trim();

      return {
        content,
        title: file.name.replace(/\.pdf$/i, ''),
      };
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error('Failed to read PDF document');
    }
  }
}
