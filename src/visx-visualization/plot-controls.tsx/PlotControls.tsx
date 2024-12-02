import { CloseRounded, Settings } from "@mui/icons-material";
import Button from "@mui/material/Button";
import React, { PropsWithChildren, useState } from "react";
import { useParentRef } from "../../contexts/ContainerRefContext";

import {
  Divider,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Typography,
  useEventCallback,
} from "@mui/material";
import Drawer from "@mui/material/Drawer";
import {
  useColumnConfig,
  useRowConfig,
} from "../../contexts/AxisConfigContext";
import { DisplayControls } from "./DisplayControls";
import { JumpToSection } from "./JumpToSection";
import {
  PlotControlsSection,
  PlotControlsSectionProvider,
} from "./PlotControlsContext";
import { SortControls } from "./SortControls";

interface PlotControlsProps {
  onClose: () => void;
}

interface PlotControlSectionProps extends PropsWithChildren {
  selectedValue: PlotControlsSection;
  value: PlotControlsSection;
}

function PlotControlSection({
  value,
  selectedValue,
  ...other
}: PlotControlSectionProps) {
  return (
    <PlotControlsSectionProvider value={value}>
      <div
        role="tabpanel"
        hidden={value !== selectedValue}
        id={`tabpanel-${value}`}
        aria-labelledby={`simple-tab-${value}`}
        {...other}
      >
        <JumpToSection />
        <Divider />
        <SortControls />
        <Divider />
        <DisplayControls />
      </div>
    </PlotControlsSectionProvider>
  );
}

function PlotControls({ onClose }: PlotControlsProps) {
  const [selectedTab, setSelectedTab] = useState<PlotControlsSection>("Column");
  const columnLabel = useColumnConfig((s) => s.label);
  const columnIcon = useColumnConfig((s) => s.icon);
  const rowLabel = useRowConfig((s) => s.label);
  const rowIcon = useRowConfig((s) => s.icon);

  return (
    <Stack spacing={2} padding={2} direction="column" position="relative">
      <Stack
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        direction="row"
        position="sticky"
        top={0}
      >
        <Typography variant="h5" component="label">
          Plot Controls
        </Typography>
        <IconButton aria-label="Close Plot Controls" onClick={onClose}>
          <CloseRounded />
        </IconButton>
      </Stack>
      <Tabs
        variant="fullWidth"
        value={selectedTab}
        onChange={(_e, value) => setSelectedTab(value)}
      >
        <Tab
          label={`Column: ${columnLabel}`}
          value="Column"
          icon={columnIcon}
          iconPosition="start"
        />
        <Tab
          label={`Row: ${rowLabel}`}
          value="Row"
          icon={rowIcon}
          iconPosition="start"
        />
      </Tabs>
      <PlotControlSection value="Column" selectedValue={selectedTab} />
      <PlotControlSection value="Row" selectedValue={selectedTab} />
    </Stack>
  );
}

export function PlotControlsButton() {
  const parentRef = useParentRef();
  const [showDrawer, setShowDrawer] = useState(false);
  const closeDrawer = useEventCallback(() => setShowDrawer(false));
  const openDrawer = useEventCallback(() => setShowDrawer(true));
  const parentBoundingBox = parentRef.current?.getBoundingClientRect();
  const windowBoundingBox = window.document.body.getBoundingClientRect();
  return (
    <>
      <Button
        variant="contained"
        color="primary"
        startIcon={<Settings />}
        sx={{ whiteSpace: "nowrap" }}
        onClick={openDrawer}
      >
        Plot Controls
      </Button>
      <Drawer
        container={parentRef.current}
        open={showDrawer}
        onClose={closeDrawer}
        anchor="right"
        ModalProps={{
          sx: {
            top: parentBoundingBox?.top,
            height: parentBoundingBox?.height,
            right: windowBoundingBox.right - parentBoundingBox?.right,
          },
        }}
        slotProps={{
          backdrop: {
            sx: {
              top: parentBoundingBox?.top,
              height: parentBoundingBox?.height,
              left: parentBoundingBox?.left,
              width: parentBoundingBox?.width,
            },
          },
        }}
        PaperProps={{
          sx: {
            maxWidth: {
              xs: "100%",
              md: 450,
            },
            top: parentBoundingBox?.top,
            height: parentBoundingBox?.height,
            right: windowBoundingBox.right - parentBoundingBox?.right,
            scrollBehavior: "smooth",
          },
        }}
      >
        <PlotControls onClose={closeDrawer} />
      </Drawer>
    </>
  );
}