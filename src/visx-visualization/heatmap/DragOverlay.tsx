import React, {
  PropsWithChildren,
  startTransition,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { ScaleBand, useXScale, useYScale } from "../../contexts/ScaleContext";
import { useSelectedDimension } from "../../contexts/SelectedDimensionContext";

import {
  CollisionDetection,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useEventCallback } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  useColumnConfig,
  useRowConfig,
} from "../../contexts/AxisConfigContext";
import { useParentRef } from "../../contexts/ContainerRefContext";
import { useDataHistory, useDataMap } from "../../contexts/DataContext";
import {
  useDimensions,
  useHeatmapDimensions,
} from "../../contexts/DimensionsContext";
import { useSetTooltipData } from "../../contexts/TooltipDataContext";
import { Setter } from "../../utils/types";

interface DragOverlayContainerProps extends PropsWithChildren {
  items: string[];
  setItems: Setter<string[]>;
  resetSort: () => void;
}
const customCollisionDetectionAlgorithm: CollisionDetection = (args) => {
  // First, let's see if there are any collisions with the pointer
  const pointerCollisions = pointerWithin(args);

  // Collision detection algorithms return an array of collisions
  if (pointerCollisions.length > 0) {
    return pointerCollisions;
  }

  // If there are no collisions with the pointer, return rectangle intersections
  return rectIntersection(args);
};

const indicatorProps = (
  x: ScaleBand<string>,
  y: ScaleBand<string>,
  width: number,
  height: number,
) => ({
  X: {
    width: x.bandwidth(),
    height,
    left: (item: string) => x(item),
    top: () => 0,
  },
  Y: {
    width,
    height: (item: string) => y.bandwidth(item),
    left: () => 0,
    top: (item: string) => y(item),
  },
});

/**
 * Wrapper for the heatmap which allows for dragging and dropping of rows or columns.
 * @param props.items The items to be sorted.
 * @param props.setItems Setter for the items.
 * @param props.resetSort Resetter for the sort order. Used to reset the sort order when custom sorting is applied.
 * @returns
 */
function DragOverlayContainer({
  children,
  items,
  setItems,
  resetSort,
}: DragOverlayContainerProps) {
  const { selectedDimension } = useSelectedDimension();

  const dataHistory = useDataHistory();

  const { scale: x } = useXScale();
  const { scale: y } = useYScale();
  const { width, height } = useHeatmapDimensions();

  const strategy = useMemo(() => {
    return selectedDimension === "X"
      ? verticalListSortingStrategy
      : horizontalListSortingStrategy;
  }, [selectedDimension]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const initialItemOrder = useRef<string[]>(items);
  const lastOver = useRef<string | number | null>(null);

  const startDrag = useEventCallback(() => {
    console.log("pausing data history");
    if (dataHistory.pastStates.length === 0) {
      dataHistory.pastStates.push();
    }
    dataHistory.pause();
    initialItemOrder.current = items;
    lastOver.current = null;
  });

  const cancelDrag = useEventCallback(() => {
    startTransition(() => {
      setItems(initialItemOrder.current);
    });
    dataHistory.resume();
    console.log("resuming data history");
  });

  const handleDrag = useEventCallback(({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id || lastOver.current === over.id) {
      lastOver.current = over.id;
      return;
    }
    lastOver.current = over.id;
    const oldIndex = items.indexOf(active.id as string);
    const newIndex = items.indexOf(over.id as string);
    setItems(arrayMove(items, oldIndex, newIndex));
    resetSort();
  });

  const handleDragEnd = useEventCallback((e: DragEndEvent) => {
    dataHistory.resume();
    handleDrag(e);
  });

  if (items.length === 0) {
    return children;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetectionAlgorithm}
      onDragStart={startDrag}
      onDragCancel={cancelDrag}
      onDragMove={handleDrag}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToParentElement]}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.BeforeDragging,
        },
      }}
    >
      <SortableContext items={items} strategy={strategy}>
        {items.map((item) => (
          <DragIndicator
            key={item}
            item={item}
            {...indicatorProps(x, y, width, height)[selectedDimension]}
          />
        ))}
        {children}
      </SortableContext>
    </DndContext>
  );
}

function DragIndicator({
  item,
  width: itemWidth,
  height: itemHeight,
  left,
  top,
}: {
  item: string;
  width: number;
  height: number | ((item: string) => number);
  left: (item: string) => number;
  top: (item: string) => number;
}) {
  const { selectedDimension } = useSelectedDimension();
  const { scale: x } = useXScale();
  const { scale: y } = useYScale();

  const { columnSizes, rowSizes } = useDimensions();
  const dataMap = useDataMap();

  const xOffset = columnSizes[0];
  const yOffset = rowSizes[0];

  const theme = useTheme();
  const rowLabel = useRowConfig((store) => store.label);
  const columnLabel = useColumnConfig((store) => store.label);
  const { width, height } = useHeatmapDimensions();

  const strategy =
    selectedDimension === "X"
      ? verticalListSortingStrategy
      : horizontalListSortingStrategy;
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id: item,
    strategy,
  });
  const parentRef = useParentRef();
  const { openTooltip, closeTooltip } = useSetTooltipData();

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const visualizationBounds = parentRef.current?.getBoundingClientRect();
      if (!visualizationBounds) {
        return;
      }
      // e.clientX = mouse position relative to the viewport
      // xOffset = position of the heatmap relative to the bounds of the cellpop container
      // visualizationBounds.left = position of the cellpop container relative to the viewport
      const xValue = e.clientX - xOffset - visualizationBounds.left;

      // y position is inverted to match the y scale
      const visualizationTotalHeight =
        yOffset + height + visualizationBounds.top;
      const yMousePosition = e.clientY;
      const yValue = height - (visualizationTotalHeight - yMousePosition);

      const columnKey = x.lookup(xValue);
      const rowKey = y.lookup(yValue);

      if (!rowKey || !columnKey) {
        return;
      }

      openTooltip(
        {
          title: `${rowKey} - ${columnKey}`,
          data: {
            "Cell Count": dataMap[`${rowKey}-${columnKey}`],
            [rowLabel]: rowKey,
            [columnLabel]: columnKey,
          },
        },
        e.clientX,
        e.clientY,
      );
    },
    [x, y, xOffset, yOffset, dataMap, rowLabel, columnLabel, width, height],
  );

  return (
    <div
      key={item}
      style={{
        width: itemWidth,
        height: itemHeight instanceof Function ? itemHeight(item) : itemHeight,
        position: "absolute",
        zIndex: 1,
        left: left(item),
        top: top(item),
        outline: isDragging
          ? `3px solid ${theme.palette.text.primary}`
          : "none",
      }}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onMouseMove={onMouseMove}
      onMouseOut={closeTooltip}
    ></div>
  );
}

export default DragOverlayContainer;
