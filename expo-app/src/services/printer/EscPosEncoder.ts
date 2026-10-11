import { PaperWidth } from './printerTypes';

const CHAR_WIDTH_58 = 32;
const CHAR_WIDTH_80 = 48;

export class EscPosEncoder {
  private buffer: number[] = [];

  constructor() {}

  public initialize(): this {
    this.buffer.push(0x1b, 0x40); // ESC @
    return this;
  }

  public alignLeft(): this {
    this.buffer.push(0x1b, 0x61, 0x00);
    return this;
  }

  public alignCenter(): this {
    this.buffer.push(0x1b, 0x61, 0x01);
    return this;
  }

  public alignRight(): this {
    this.buffer.push(0x1b, 0x61, 0x02);
    return this;
  }

  public bold(on: boolean): this {
    this.buffer.push(0x1b, 0x45, on ? 0x01 : 0x00);
    return this;
  }

  public text(str: string): this {
    for (let i = 0; i < str.length; i++) {
      let code = str.charCodeAt(i);
      // Basic substitution for common unsupported characters (like ₹)
      if (code === 0x20B9) {
        // Fallback for Rupee symbol: Rs
        this.buffer.push(0x52, 0x73, 0x20);
      } else if (code < 256) {
        this.buffer.push(code);
      } else {
        // Replace with ?
        this.buffer.push(0x3f);
      }
    }
    return this;
  }

  public newline(): this {
    this.buffer.push(0x0a);
    return this;
  }

  public line(str: string): this {
    return this.text(str).newline();
  }

  public separator(width: PaperWidth = '58mm', char: string = '-'): this {
    const w = width === '80mm' ? CHAR_WIDTH_80 : CHAR_WIDTH_58;
    return this.line(char.repeat(w));
  }

  public paperFeed(lines: number = 3): this {
    this.buffer.push(0x1b, 0x64, lines);
    return this;
  }

  public cut(): this {
    // GS V 66 0
    this.buffer.push(0x1d, 0x56, 0x42, 0x00);
    return this;
  }

  public size(widthMult: number, heightMult: number): this {
    // GS ! n
    const w = Math.min(Math.max(widthMult - 1, 0), 7);
    const h = Math.min(Math.max(heightMult - 1, 0), 7);
    const n = (w << 4) | h;
    this.buffer.push(0x1d, 0x21, n);
    return this;
  }

  public build(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}

export function formatTwoColumns(left: string, right: string, width: PaperWidth = '58mm'): string {
  const w = width === '80mm' ? CHAR_WIDTH_80 : CHAR_WIDTH_58;
  const leftLen = left.length;
  const rightLen = right.length;
  if (leftLen + rightLen + 1 > w) {
    // Truncate left
    const newLeft = left.substring(0, w - rightLen - 4) + '...';
    return newLeft + ' '.repeat(w - newLeft.length - rightLen) + right;
  }
  return left + ' '.repeat(w - leftLen - rightLen) + right;
}

export function formatThreeColumns(left: string, center: string, right: string, width: PaperWidth = '58mm'): string {
  const w = width === '80mm' ? CHAR_WIDTH_80 : CHAR_WIDTH_58;
  const centerColWidth = 6;
  const rightColWidth = 8;
  const maxLeft = w - centerColWidth - rightColWidth;
  
  let formattedLeft = left;
  if (left.length > maxLeft - 1) {
    formattedLeft = left.substring(0, maxLeft - 4) + '...';
  }
  
  const p1 = Math.max(0, maxLeft - formattedLeft.length);
  const p2 = Math.max(0, centerColWidth - center.length);
  const p3 = Math.max(0, rightColWidth - right.length);
  
  return formattedLeft + ' '.repeat(p1) + ' '.repeat(p2) + center + ' '.repeat(p3) + right;
}
