import { Document, Paragraph, TextRun, Packer, HeadingLevel } from 'docx';
import mammoth from 'mammoth';
import { saveAs } from 'file-saver';

export interface PolicyDocumentData {
  id: string;
  title: string;
  title_ar?: string;
  description?: string;
  content: string;
  category: string;
  status?: string;
  version?: number;
  created_at?: string;
  updated_at?: string;
}

export class WordDocumentService {
  static async exportToWord(policy: PolicyDocumentData): Promise<void> {
    try {
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // Title
            new Paragraph({
              children: [
                new TextRun({
                  text: policy.title,
                  bold: true,
                  size: 32,
                }),
              ],
              heading: HeadingLevel.TITLE,
            }),

            // Arabic Title (if available)
            ...(policy.title_ar ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: policy.title_ar,
                    bold: true,
                    size: 28,
                  }),
                ],
                heading: HeadingLevel.HEADING_1,
              }),
            ] : []),

            // Policy Information
            new Paragraph({
              children: [
                new TextRun({
                  text: "Policy Information",
                  bold: true,
                  size: 24,
                }),
              ],
              heading: HeadingLevel.HEADING_1,
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: `Policy ID: ${policy.id}`,
                }),
              ],
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: `Category: ${policy.category}`,
                }),
              ],
            }),

            ...(policy.status ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Status: ${policy.status}`,
                  }),
                ],
              }),
            ] : []),

            ...(policy.version ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Version: ${policy.version}`,
                  }),
                ],
              }),
            ] : []),

            new Paragraph({
              children: [
                new TextRun({
                  text: `Created: ${policy.created_at ? new Date(policy.created_at).toLocaleDateString() : 'N/A'}`,
                }),
              ],
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: `Last Updated: ${policy.updated_at ? new Date(policy.updated_at).toLocaleDateString() : 'N/A'}`,
                }),
              ],
            }),

            // Empty line
            new Paragraph({
              children: [new TextRun({ text: "" })],
            }),

            // Description (if available)
            ...(policy.description ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Description",
                    bold: true,
                    size: 20,
                  }),
                ],
                heading: HeadingLevel.HEADING_2,
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: policy.description,
                  }),
                ],
              }),
              new Paragraph({
                children: [new TextRun({ text: "" })],
              }),
            ] : []),

            // Content
            new Paragraph({
              children: [
                new TextRun({
                  text: "Policy Content",
                  bold: true,
                  size: 20,
                }),
              ],
              heading: HeadingLevel.HEADING_2,
            }),

            // Parse and format content
            ...this.parseContentToParagraphs(policy.content),
          ],
        }],
      });

      const buffer = await Packer.toBuffer(doc);
      const blob = new Blob([new Uint8Array(buffer)], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      const fileName = `${policy.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.docx`;
      saveAs(blob, fileName);
    } catch (error) {
      console.error('Error exporting to Word:', error);
      throw new Error('Failed to export document to Word format');
    }
  }

  static async importFromWord(file: File): Promise<{ content: string; title?: string }> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      
      // Extract title from first line if it looks like a title
      const lines = result.value.split('\n').filter(line => line.trim());
      const title = lines.length > 0 ? lines[0].trim() : undefined;
      
      return {
        content: result.value,
        title: title && title.length < 200 ? title : undefined
      };
    } catch (error) {
      console.error('Error importing from Word:', error);
      throw new Error('Failed to import Word document');
    }
  }

  static async importFromWordWithFormatting(file: File): Promise<{ html: string; title?: string }> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      
      // Extract title from HTML
      const titleMatch = result.value.match(/<h1[^>]*>(.*?)<\/h1>/);
      const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : undefined;
      
      return {
        html: result.value,
        title: title && title.length < 200 ? title : undefined
      };
    } catch (error) {
      console.error('Error importing formatted Word document:', error);
      throw new Error('Failed to import Word document with formatting');
    }
  }

  private static parseContentToParagraphs(content: string): Paragraph[] {
    const lines = content.split('\n');
    const paragraphs: Paragraph[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        // Empty line
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: "" })],
        }));
        continue;
      }

      // Check for headings (markdown style)
      if (trimmedLine.startsWith('# ')) {
        paragraphs.push(new Paragraph({
          children: [
            new TextRun({
              text: trimmedLine.substring(2),
              bold: true,
              size: 24,
            }),
          ],
          heading: HeadingLevel.HEADING_1,
        }));
      } else if (trimmedLine.startsWith('## ')) {
        paragraphs.push(new Paragraph({
          children: [
            new TextRun({
              text: trimmedLine.substring(3),
              bold: true,
              size: 20,
            }),
          ],
          heading: HeadingLevel.HEADING_2,
        }));
      } else if (trimmedLine.startsWith('### ')) {
        paragraphs.push(new Paragraph({
          children: [
            new TextRun({
              text: trimmedLine.substring(4),
              bold: true,
              size: 18,
            }),
          ],
          heading: HeadingLevel.HEADING_3,
        }));
      } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
        // Bullet points
        paragraphs.push(new Paragraph({
          children: [
            new TextRun({
              text: `• ${trimmedLine.substring(2)}`,
            }),
          ],
        }));
      } else if (/^\d+\.\s/.test(trimmedLine)) {
        // Numbered lists
        paragraphs.push(new Paragraph({
          children: [
            new TextRun({
              text: trimmedLine,
            }),
          ],
        }));
      } else {
        // Regular paragraph
        paragraphs.push(new Paragraph({
          children: [
            new TextRun({
              text: trimmedLine,
            }),
          ],
        }));
      }
    }

    return paragraphs;
  }

  static async createTemplateDocument(templateData: {
    title: string;
    category: string;
    sections: string[];
  }): Promise<void> {
    try {
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: templateData.title,
                  bold: true,
                  size: 32,
                }),
              ],
              heading: HeadingLevel.TITLE,
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: `Category: ${templateData.category}`,
                  italics: true,
                }),
              ],
            }),

            new Paragraph({
              children: [new TextRun({ text: "" })],
            }),

            ...templateData.sections.map(section => 
              new Paragraph({
                children: [
                  new TextRun({
                    text: section,
                    bold: true,
                    size: 20,
                  }),
                ],
                heading: HeadingLevel.HEADING_2,
              })
            ),

            new Paragraph({
              children: [new TextRun({ text: "" })],
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "[Fill in your policy content here]",
                  italics: true,
                  color: "808080",
                }),
              ],
            }),
          ],
        }],
      });

      const buffer = await Packer.toBuffer(doc);
      const blob = new Blob([new Uint8Array(buffer)], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      const fileName = `${templateData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_template.docx`;
      saveAs(blob, fileName);
    } catch (error) {
      console.error('Error creating template document:', error);
      throw new Error('Failed to create template document');
    }
  }
}