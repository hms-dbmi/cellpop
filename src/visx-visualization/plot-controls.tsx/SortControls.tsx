import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Add,
  ArrowDownwardRounded,
  ArrowUpwardRounded,
  Close,
  DragHandle,
  ExpandMoreRounded,
  Restore,
  Sort,
} from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  FormControl,
  FormControlLabel,
  Icon,
  IconButton,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  SelectChangeEvent,
  Stack,
  Typography,
  useEventCallback,
} from "@mui/material";
import React from "react";
import {
  SortOrder,
  useAvailableColumnSorts,
  useAvailableRowSorts,
  useData,
} from "../../contexts/DataContext";
import { usePlotControlsContext } from "./PlotControlsContext";
import { LeftAlignedButton } from "./style";

function useAvailableSorts() {
  const section = usePlotControlsContext();
  const columns = useAvailableColumnSorts();
  const rows = useAvailableRowSorts();
  return section === "Column" ? columns : rows;
}

function useAddSort() {
  const section = usePlotControlsContext();

  const availableSorts = useAvailableSorts();
  const addSort = useData((s) =>
    section === "Column" ? s.addColumnSortOrder : s.addRowSortOrder,
  );
  const disabled = availableSorts.length === 0;
  const onClick = useEventCallback(() => {
    if (availableSorts.length > 0) {
      addSort({ key: availableSorts[0], direction: "asc" });
    }
  });
  return { disabled, onClick };
}

function useResetSorts() {
  const section = usePlotControlsContext();
  const resetSorts = useData((s) =>
    section === "Column" ? s.clearColumnSortOrder : s.clearRowSortOrder,
  );
  const currentSorts = useData((s) =>
    section === "Column" ? s.columnSortOrder : s.rowSortOrder,
  );
  const disabled = currentSorts.length === 0;
  const onClick = useEventCallback(() => {
    resetSorts();
  });
  return { disabled, onClick };
}

export function SortControls() {
  const section = usePlotControlsContext();
  const { sorts, setSorts } = useData((s) => ({
    sorts: section === "Column" ? s.columnSortOrder : s.rowSortOrder,
    setSorts: section === "Column" ? s.setColumnSortOrder : s.setRowSortOrder,
  }));

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useEventCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = sorts.findIndex((sort) => sort.key === active.id);
      const newIndex = sorts.findIndex((sort) => sort.key === over.id);

      setSorts(arrayMove(sorts, oldIndex, newIndex));
    }
  });

  return (
    <Accordion defaultExpanded>
      <AccordionSummary
        expandIcon={<ExpandMoreRounded />}
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        <Sort />
        <Typography variant="subtitle1">Sorts</Typography>
      </AccordionSummary>

      <AccordionDetails>
        <Typography variant="body2">
          Customize how columns are sorted by selecting the primary sorting
          field. Drag and reorder sorting fields to adjust their priority.
        </Typography>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sorts.map((s) => s.key)}
            strategy={verticalListSortingStrategy}
          >
            <Stack>
              {sorts.map((sort, i) => (
                <SortItem key={sort.key} sort={sort} index={i} />
              ))}
            </Stack>
          </SortableContext>
        </DndContext>
        <Stack direction="column">
          <LeftAlignedButton
            variant="text"
            startIcon={<Add />}
            {...useAddSort()}
          >
            Add Sort
          </LeftAlignedButton>
          <LeftAlignedButton
            variant="text"
            startIcon={<Restore />}
            {...useResetSorts()}
          >
            Reset Sort
          </LeftAlignedButton>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

const useSortItemActions = () => {
  const section = usePlotControlsContext();
  const editSort = useData((s) =>
    section === "Column" ? s.editColumnSortOrder : s.editRowSortOrder,
  );
  const removeSort = useData((s) =>
    section === "Column" ? s.removeColumnSortOrder : s.removeRowSortOrder,
  );
  return { editSort, removeSort };
};

function SortItem({ sort, index }: { sort: SortOrder<string>; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: sort.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const { editSort, removeSort } = useSortItemActions();

  const sortText = index === 0 ? "Sort By" : "Then By";

  const availableSorts = useAvailableSorts();

  const onRadioChange = useEventCallback(
    (_event: React.ChangeEvent<HTMLInputElement>, value: string) => {
      const direction = value as "asc" | "desc";
      editSort(index, { ...sort, direction });
    },
  );

  const onSelectChange = useEventCallback((event: SelectChangeEvent) => {
    const key = event.target.value as string;
    editSort(index, { ...sort, key });
  });

  return (
    <Stack key={sort.key} style={style} ref={setNodeRef}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Icon component={DragHandle} {...attributes} {...listeners} />
        <Typography variant="subtitle1" noWrap sx={{ flexShrink: 0 }}>
          {sortText}
        </Typography>
        <Select value={sort.key} onChange={onSelectChange} fullWidth>
          {[sort.key, ...availableSorts].map((key) => (
            <MenuItem key={key} value={key}>
              {key}
            </MenuItem>
          ))}
        </Select>
        <Button
          aria-label={`Remove ${sort.key}`}
          component={IconButton}
          onClick={() => removeSort(index)}
          sx={{
            minWidth: 0,
            padding: 0.5,
            aspectRatio: "1/1",
          }}
        >
          <Close />
        </Button>
      </Stack>
      <FormControl>
        <RadioGroup onChange={onRadioChange} value={sort.direction}>
          <FormControlLabel
            value="asc"
            control={<Radio />}
            label={
              <Stack alignItems="center" direction="row" spacing={1}>
                <ArrowUpwardRounded />
                <Typography variant="body2">Ascending</Typography>
              </Stack>
            }
          />
          <FormControlLabel
            value="desc"
            control={<Radio />}
            label={
              <Stack alignItems="center" direction="row" spacing={1}>
                <ArrowDownwardRounded />
                <Typography variant="body2">Descending</Typography>
              </Stack>
            }
          />
        </RadioGroup>
      </FormControl>
    </Stack>
  );
}
