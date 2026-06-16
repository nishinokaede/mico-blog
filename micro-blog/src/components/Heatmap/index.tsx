import React from 'react';
import dayjs from 'dayjs';
import styles from './index.module.css';

interface HeatmapData {
  date: string;
  count: number;
}

interface HeatmapProps {
  data: HeatmapData[];
}

const COLUMNS = 6;
const ROWS = 7;
const TOTAL_CELLS = COLUMNS * ROWS;

function getColor(count: number, maxCount: number): string {
  if (count === 0) return '#ebedf0';
  if (maxCount === 0) return '#ebedf0';
  const ratio = count / maxCount;
  if (ratio <= 0.25) return '#c6e48b';
  if (ratio <= 0.5) return '#7bc96f';
  if (ratio <= 0.75) return '#239a3b';
  return '#196127';
}

function generateCells(data: HeatmapData[]): { date: string; count: number; color: string }[] {
  const today = dayjs().endOf('day');
  const counts = new Map<string, number>();

  for (const item of data) {
    counts.set(item.date, (counts.get(item.date) || 0) + item.count);
  }

  const maxCount = Math.max(...Array.from(counts.values()), 0);

  const cells: { date: string; count: number; color: string }[] = [];
  for (let i = TOTAL_CELLS - 1; i >= 0; i--) {
    const dateStr = today.subtract(i, 'day').format('YYYY-MM-DD');
    const count = counts.get(dateStr) || 0;
    cells.push({
      date: dateStr,
      count,
      color: getColor(count, maxCount),
    });
  }

  return cells;
}

const WEEKDAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', ''];

function getWeekdayLabels(): string[] {
  const today = dayjs();
  const labels: string[] = [];
  // Row 6 = today, Row 0 = 6 days ago (in the last column)
  for (let row = 0; row < ROWS; row++) {
    const weekdayIndex = today.subtract(ROWS - 1 - row, 'day').day();
    // dayjs day(): 0=Sun, 1=Mon, ..., 6=Sat → map to our labels (0=Sun empty, 1=Mon, etc.)
    labels.push(WEEKDAY_LABELS[(weekdayIndex + 6) % 7] || '');
  }
  return labels;
}

const Heatmap: React.FC<HeatmapProps> = ({ data }) => {
  const cells = generateCells(data);

  const columns: { date: string; count: number; color: string }[][] = [];
  for (let col = 0; col < COLUMNS; col++) {
    const columnCells: { date: string; count: number; color: string }[] = [];
    for (let row = 0; row < ROWS; row++) {
      const index = row * COLUMNS + col;
      if (index < cells.length) {
        columnCells.push(cells[index]);
      }
    }
    columns.push(columnCells);
  }

  const weekdayLabels = getWeekdayLabels();

  return (
    <div className={styles.heatmap}>
      <div className={styles.heatmapBody}>
        <div className={styles.weekdayLabels}>
          {weekdayLabels.map((label, i) => (
            <span key={i} className={styles.weekdayLabel}>
              {label}
            </span>
          ))}
        </div>
        <div className={styles.grid}>
          {columns.map((col, colIdx) => (
            <div key={colIdx} className={styles.column}>
              {col.map((cell) => (
                <div
                  key={cell.date}
                  className={styles.cell}
                  style={{ backgroundColor: cell.color }}
                  title={`${cell.date}: ${cell.count} posts`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className={styles.legend}>
        <span className={styles.legendLabel}>Less</span>
        <div className={styles.legendCell} style={{ backgroundColor: '#ebedf0' }} />
        <div className={styles.legendCell} style={{ backgroundColor: '#c6e48b' }} />
        <div className={styles.legendCell} style={{ backgroundColor: '#7bc96f' }} />
        <div className={styles.legendCell} style={{ backgroundColor: '#239a3b' }} />
        <div className={styles.legendCell} style={{ backgroundColor: '#196127' }} />
        <span className={styles.legendLabel}>More</span>
      </div>
    </div>
  );
};

export default Heatmap;
