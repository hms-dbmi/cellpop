import { memoize } from "proxy-memoize";
import { useMemo } from "react";
import { temporal } from "zundo";
import { createStore } from "zustand";
import { CellPopData } from "../cellpop-schema";
import { moveToEnd, moveToStart } from "../utils/array-reordering";
import { createStoreContext } from "../utils/zustand";

interface DataContextProps {
  initialData: CellPopData;
}

type RowKey = string;
type ColumnKey = string;
type DataMapKey = `${RowKey}-${ColumnKey}`;

export type SortDirection = "asc" | "desc";
export const SORT_DIRECTIONS = ["asc", "desc"] as const;
export interface SortOrder<T> {
  key: T | "count" | "alphabetical";
  direction: SortDirection;
}

export const DEFAULT_SORTS = ["count", "alphabetical"] as const;

interface DataContextState {
  data: CellPopData;
  removedRows: Set<string>;
  removedColumns: Set<string>;
  rowOrder: string[];
  columnOrder: string[];
  rowSortOrder: SortOrder<string>[];
  columnSortOrder: SortOrder<string>[];
}

interface DataContextActions {
  /**
   * Restores the removed rows to the visualization.
   */
  resetRemovedRows: () => void;
  /**
   * Restores the removed columns to the visualization.
   */
  resetRemovedColumns: () => void;
  /**
   * Removes a row from the visualization and updates counts accordingly.
   * @param row the row to remove
   */
  removeRow: (row: string) => void;
  /**
   * Removes a column from the visualization and updates counts accordingly.
   * @param column the column to remove
   * @returns
   */
  removeColumn: (column: string) => void;

  /**
   * Restores a row to the visualization.
   * @param row the row to restore
   */
  restoreRow: (row: string) => void;
  /**
   * Restores a column to the visualization.
   * @param column the column to restore
   */
  restoreColumn: (column: string) => void;
  /**
   * Sets the sort order for the rows and updates the row order accordingly.
   */
  setRowSortOrder: (sortOrder: SortOrder<string>[]) => void;
  /**
   * Sets the sort order for the columns and updates the column order accordingly.
   */
  setColumnSortOrder: (sortOrder: SortOrder<string>[]) => void;
  /**
   * Adds a sort order to the rows and updates the row order accordingly.
   */
  addRowSortOrder: (sortOrder: SortOrder<string>) => void;
  /**
   * Adds a sort order to the columns and updates the column order accordingly.
   */
  addColumnSortOrder: (sortOrder: SortOrder<string>) => void;
  /**
   * Updates a sort order for the rows at a given index and updates the row order accordingly.
   * e.g. toggling the direction of the sort order or switching to a different metadata key.
   */
  editRowSortOrder: (index: number, sortOrder: SortOrder<string>) => void;
  /**
   * Updates a sort order for the columns at a given index and updates the column order accordingly.
   * e.g. toggling the direction of the sort order or switching to a different metadata key.
   */
  editColumnSortOrder: (index: number, sortOrder: SortOrder<string>) => void;
  /**
   * Removes the sort order for the rows at a given index and updates the row order accordingly.
   */
  removeRowSortOrder: (index: number) => void;
  /**
   * Removes the sort order for the columns at a given index and updates the column order accordingly.
   */
  removeColumnSortOrder: (index: number) => void;
  /**
   * Removes all sort orders for the rows.
   */
  clearRowSortOrder: () => void;
  /**
   * Removes all sort orders for the columns.
   */
  clearColumnSortOrder: () => void;
  /**
   * Updates the order of the rows and clears the current sort orders.
   */
  setRowOrder: (order: string[]) => void;
  /**
   * Updates the order of the columns and clears the current sort orders.
   */
  setColumnOrder: (order: string[]) => void;
}

type DataContextStore = DataContextState & DataContextActions;

/**
 * Helper method for applying multiple sort orders to an array.
 * @param array The array to sort
 * @param sorts The sort orders to apply
 * @param metadata The metadata object to use for sorting
 * @param state The data context store
 * @returns The sorted array
 */
const applySortOrders = (
  array: string[],
  sorts: SortOrder<string>[],
  state: DataContextStore,
  row: boolean,
): string[] => {
  const metadata = row ? state.data.metadata.rows : state.data.metadata.cols;
  // Avoid mutating the original array by creating a copy
  const arrayCopy = [...array];
  // Consolidate the sort orders into a single comparison function by converting
  // them into a recursive function that calls the next comparison function
  // if the current comparison returns 0.
  const comparisonFunction = sorts.reduceRight(
    (acc, { key, direction }) => {
      switch (key) {
        case "alphabetical":
          return (a: string, b: string) => {
            const compare =
              direction === "asc" ? a.localeCompare(b) : b.localeCompare(a);
            if (compare === 0) {
              return acc(a, b);
            }
            return compare;
          };
        case "count": {
          const { rowCounts, columnCounts } = getDerivedStatesSelector(state);
          const counts = row ? rowCounts : columnCounts;
          return (a: string, b: string) => {
            const aValue = counts[a] as number;
            const bValue = counts[b] as number;
            const compare =
              direction === "asc" ? aValue - bValue : bValue - aValue;
            if (compare === 0) {
              return acc(a, b);
            }
            return compare;
          };
        }
        default:
          return (a: string, b: string) => {
            const aValue =
              metadata[a][key as keyof (typeof metadata)[typeof a]];
            const bValue =
              metadata[b][key as keyof (typeof metadata)[typeof b]];
            if (typeof aValue === "number" && typeof bValue === "number") {
              return direction === "asc" ? aValue - bValue : bValue - aValue;
            }
            const compare =
              direction === "asc"
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
            if (compare === 0) {
              return acc(a, b);
            }
            return compare;
          };
      }
    },
    (a: string, b: string) => a.localeCompare(b),
  );
  return arrayCopy.sort(comparisonFunction);
};

const createDataContextStore = ({ initialData }: DataContextProps) =>
  createStore<DataContextStore>()(
    temporal((set, get) => ({
      data: initialData,
      removedRows: new Set<string>(),
      removedColumns: new Set<string>(),
      rowSortOrder: [] as SortOrder<RowKey>[],
      columnSortOrder: [] as SortOrder<ColumnKey>[],
      rowOrder: initialData.rowNames,
      columnOrder: initialData.colNames,
      resetRemovedRows: () => {
        set({ removedRows: new Set<string>() });
      },
      resetRemovedColumns: () => {
        set({ removedColumns: new Set<string>() });
      },
      removeRow: (row: string) => {
        set((state) => {
          const removedRows = new Set(state.removedRows);
          removedRows.add(row);
          return { removedRows };
        });
      },
      removeColumn: (column: string) => {
        set((state) => {
          const removedColumns = new Set(state.removedColumns);
          removedColumns.add(column);
          return { removedColumns };
        });
      },
      restoreRow: (row: string) => {
        set((state) => {
          const removedRows = new Set(state.removedRows);
          removedRows.delete(row);
          return { removedRows };
        });
      },
      restoreColumn: (column: string) => {
        set((state) => {
          const removedColumns = new Set(state.removedColumns);
          removedColumns.delete(column);
          return { removedColumns };
        });
      },

      setColumnSortOrder: (sortOrder: SortOrder<ColumnKey>[]) => {
        const columnOrder = applySortOrders(
          initialData.colNames,
          sortOrder,
          get(),
          false,
        );
        set({ columnSortOrder: sortOrder, columnOrder });
      },
      setRowSortOrder: (sortOrder: SortOrder<RowKey>[]) => {
        const rowOrder = applySortOrders(
          initialData.rowNames,
          sortOrder,
          get(),
          true,
        );
        set({ rowSortOrder: sortOrder, rowOrder });
      },
      addRowSortOrder: (sortOrder: SortOrder<RowKey>) => {
        set((state) => {
          const rowSortOrder = [...state.rowSortOrder, sortOrder];
          const rowOrder = applySortOrders(
            state.rowOrder,
            rowSortOrder,
            get(),
            true,
          );
          return { rowSortOrder, rowOrder };
        });
      },
      addColumnSortOrder: (sortOrder: SortOrder<ColumnKey>) => {
        set((state) => {
          const columnSortOrder = [...state.columnSortOrder, sortOrder];
          const columnOrder = applySortOrders(
            state.columnOrder,
            columnSortOrder,
            get(),
            false,
          );
          return { columnSortOrder, columnOrder };
        });
      },
      editRowSortOrder: (index: number, sortOrder: SortOrder<RowKey>) => {
        set((state) => {
          const rowSortOrder = [...state.rowSortOrder];
          rowSortOrder[index] = sortOrder;
          const rowOrder = applySortOrders(
            state.rowOrder,
            rowSortOrder,
            get(),
            true,
          );
          return { rowSortOrder, rowOrder };
        });
      },
      editColumnSortOrder: (index: number, sortOrder: SortOrder<ColumnKey>) => {
        set((state) => {
          const columnSortOrder = [...state.columnSortOrder];
          columnSortOrder[index] = sortOrder;
          const columnOrder = applySortOrders(
            state.columnOrder,
            columnSortOrder,
            get(),
            false,
          );
          return { columnSortOrder, columnOrder };
        });
      },
      removeRowSortOrder: (index: number) => {
        set((state) => {
          const rowSortOrder = state.rowSortOrder.slice(index, index + 1);
          const rowOrder = applySortOrders(
            state.rowOrder,
            rowSortOrder,
            get(),
            true,
          );
          return { rowSortOrder, rowOrder };
        });
      },
      removeColumnSortOrder: (index: number) => {
        set((state) => {
          const columnSortOrder = state.columnSortOrder.slice(index, index + 1);
          const columnOrder = applySortOrders(
            state.columnOrder,
            columnSortOrder,
            get(),
            false,
          );
          return { columnSortOrder, columnOrder };
        });
      },
      clearRowSortOrder: () => {
        set({ rowSortOrder: [] });
      },
      clearColumnSortOrder: () => {
        set({ columnSortOrder: [] });
      },
      setRowOrder: (order: string[]) => {
        set({ rowOrder: order, rowSortOrder: [] });
      },
      setColumnOrder: (order: string[]) => {
        set({ columnOrder: order, columnSortOrder: [] });
      },
    })),
  );

export const [DataProvider, useData, , useDataHistory] = createStoreContext<
  DataContextStore,
  DataContextProps,
  true
>(createDataContextStore, "DataContextStore", true);

const getDerivedStatesSelector = (state: DataContextStore) => {
  const rowCounts: Record<string, number> = {};
  const columnCounts: Record<string, number> = {};
  const rowMaxes: Record<string, number> = {};
  const columnMaxes: Record<string, number> = {};
  let maxCount = 0;
  const { removedRows, removedColumns } = state;
  state.data.countsMatrix.forEach(({ row, col, value }) => {
    if (removedRows.has(row) || removedColumns.has(col)) {
      return;
    }
    rowCounts[row] = (rowCounts[row] || 0) + value;
    columnCounts[col] = (columnCounts[col] || 0) + value;
    rowMaxes[row] = Math.max(rowMaxes[row] || 0, value);
    columnMaxes[col] = Math.max(columnMaxes[col] || 0, value);
    maxCount = Math.max(maxCount, value);
  });
  return {
    rowCounts,
    columnCounts,
    rowMaxes,
    columnMaxes,
    maxCount,
  };
};

const getDerivedStatesMemo = memoize(getDerivedStatesSelector);

const getDataMap = memoize((state: DataContextStore) => {
  const dataMap: Record<DataMapKey, number> = {};
  state.data.countsMatrix.forEach(({ row, col, value }) => {
    dataMap[`${row}-${col}`] = value;
  });
  return dataMap;
});

const getRowNames = memoize((state: DataContextStore) => {
  const { rowOrder, removedRows } = state;
  return rowOrder.filter((row) => !removedRows.has(row));
});

const getColumnNames = memoize((state: DataContextStore) => {
  const { columnOrder, removedColumns } = state;
  return columnOrder.filter((column) => !removedColumns.has(column));
});

const getMetadataKeys = (
  metadata: Record<string, Record<string, string | number>>,
) => {
  const metadataValues = Object.values(metadata);
  const set = metadataValues.reduce<Set<string>>(
    (acc: Set<string>, curr: object) => {
      Object.keys(curr).forEach((key) => {
        acc.add(key);
      });
      return acc;
    },
    new Set<string>(),
  );
  return [...set];
};

const getRowSortKeys = memoize((state: DataContextStore) => {
  return getMetadataKeys(state.data.metadata.rows);
});

const getColumnSortKeys = memoize((state: DataContextStore) => {
  return getMetadataKeys(state.data.metadata.cols);
});

const useMetadataKeys = (direction: "row" | "column") => {
  return useData(direction === "row" ? getRowSortKeys : getColumnSortKeys);
};

const useSortKeys = (direction: "row" | "column") => {
  const metadataKeys = useMetadataKeys(direction);
  return useMemo(
    () => ["count", "alphabetical", ...metadataKeys],
    [metadataKeys],
  );
};

export const useRowSortKeys = () => {
  return useSortKeys("row");
};

export const useRowMetadataKeys = () => {
  return useMetadataKeys("row");
};

export const useRowSorts: () => SortOrder<string>[] = () => {
  const keys = useRowSortKeys();
  return useMemo(() => {
    return ["asc", "desc"].flatMap((direction) =>
      keys.map((key) => ({ key, direction }) as SortOrder<string>),
    );
  }, [keys]);
};

export const useColumnMetadataKeys = () => {
  return useMetadataKeys("column");
};

export const useColumnSortKeys = () => {
  return useSortKeys("column");
};

export const useColumnSorts: () => SortOrder<string>[] = () => {
  const keys = useColumnSortKeys();
  return useMemo(() => {
    return ["asc", "desc"].flatMap((direction) =>
      keys.map((key) => ({ key, direction }) as SortOrder<string>),
    );
  }, [keys]);
};

export const useDataMap = () => {
  return useData(getDataMap);
};

export const useRowCounts = () => {
  return useData(getDerivedStatesMemo).rowCounts;
};

export const useColumnCounts = () => {
  return useData(getDerivedStatesMemo).columnCounts;
};

export const useRowMaxes = () => {
  return useData(getDerivedStatesMemo).rowMaxes;
};

export const useColumnMaxes = () => {
  return useData(getDerivedStatesMemo).columnMaxes;
};

export const useMaxCount = () => {
  return useData(getDerivedStatesMemo).maxCount;
};

export const useRows = () => {
  return useData(getRowNames);
};

export const useColumns = () => {
  return useData(getColumnNames);
};

export const useAvailableRowSorts = () => {
  const rowSortKeys = useRowSortKeys();
  const rowSortOrder = useData((s) => s.rowSortOrder);
  return rowSortKeys.filter(
    (key) => !rowSortOrder.some((sort) => sort.key === key),
  );
};

export const useAvailableColumnSorts = () => {
  const columnSortKeys = useColumnSortKeys();
  const columnSortOrder = useData((s) => s.columnSortOrder);
  return columnSortKeys.filter(
    (key) => !columnSortOrder.some((sort) => sort.key === key),
  );
};

export const useHighestColumnCount = () => {
  const columnCounts = useColumnCounts();
  return Math.max(
    ...Object.values(columnCounts).filter((count) => !isNaN(count)),
  );
};

export const useHighestRowCount = () => {
  const rowCounts = useRowCounts();
  return Math.max(...Object.values(rowCounts).filter((count) => !isNaN(count)));
};

export const useMoveRowToEnd = () => {
  const setRowOrder = useData((s) => s.setRowOrder);
  const rowOrder = useData((s) => s.rowOrder);
  return (row: string) => {
    setRowOrder(moveToEnd(rowOrder, row));
  };
};

export const useMoveRowToStart = () => {
  const setRowOrder = useData((s) => s.setRowOrder);
  const rowOrder = useData((s) => s.rowOrder);
  return (row: string) => {
    setRowOrder(moveToStart(rowOrder, row));
  };
};

export const useMoveColumnToEnd = () => {
  const setColumnOrder = useData((s) => s.setColumnOrder);
  const columnOrder = useData((s) => s.columnOrder);
  return (column: string) => {
    setColumnOrder(moveToEnd(columnOrder, column));
  };
};

export const useMoveColumnToStart = () => {
  const setColumnOrder = useData((s) => s.setColumnOrder);
  const columnOrder = useData((s) => s.columnOrder);
  return (column: string) => {
    setColumnOrder(moveToStart(columnOrder, column));
  };
};
