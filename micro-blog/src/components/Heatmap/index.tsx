import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import styles from './index.module.css';

interface HeatmapData {
  date: string;
  count: number;
}

interface HeatmapProps {
  data: HeatmapData[];
  onCellClick?: (date: string) => void;
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

const Heatmap: React.FC<HeatmapProps> = ({ data, onCellClick }) => {
  const columns = useMemo(() => {
    const today = dayjs();
    const counts = new Map<string, number>();
    for (const item of data) {
      counts.set(item.date, (counts.get(item.date) || 0) + item.count);
    }
    const maxCount = Math.max(...Array.from(counts.values()), 0);

    const startDate = today.subtract(TOTAL_CELLS - 1, 'day');
    const cells: { date: string; count: number; color: string; label: string }[] = [];

    for (let i = 0; i < TOTAL_CELLS; i++) {
      const d = startDate.add(i, 'day');
      const dateStr = d.format('YYYY-MM-DD');
      const count = counts.get(dateStr) || 0;
      cells.push({
        date: dateStr,
        count,
        color: getColor(count, maxCount),
        label: `${dateStr}: ${count} posts`,
      });
    }

    const cols: { date: string; count: number; color: string; label: string }[][] = [];
    for (let c = 0; c < COLUMNS; c++) {
      cols.push(cells.slice(c * ROWS, (c + 1) * ROWS));
    }
    return cols;
  }, [data]);

  return (
    <div className={styles.heatmap}>
      <div className={styles.grid}>
        {columns.map((col, colIdx) => (
          <div key={colIdx} className={styles.column}>
            {col.map((cell) => (
              <div
                key={cell.date}
                className={styles.cell}
                style={{
                  backgroundColor: cell.color,
                  cursor: cell.count > 0 && onCellClick ? 'pointer' : 'default',
                }}
                title={cell.label}
                onClick={() => {
                  if (cell.count > 0 && onCellClick) {
                    onCellClick(cell.date);
                  }
                }}
              />
            ))}
          </div>
        ))}
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
