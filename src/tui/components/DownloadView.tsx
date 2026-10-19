import React from 'react';
import { Box, Text } from 'ink';
import type { DownloadStats } from '../../download.js';
import { LOGO } from './Logo.js';

interface DownloadViewProps {
  width: number;
  height: number;
  downloaded: number;
  skipped: number;
  failed: number;
  total: number;
  currentFile: string;
  status: string;
  isComplete: boolean;
  stats: DownloadStats | null;
  spinIdx: number;
}

const SPINNERS = ['-', '\\', '|', '/'];
const ACCENT = '#7f9db5';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function ProgressBar({
  progress,
  width,
}: {
  progress: number;
  width: number;
}) {
  const filled = Math.max(0, Math.min(width, Math.round(progress * width)));
  const empty = Math.max(0, width - filled);
  return (
    <Text>
      <Text color={ACCENT}>{'='.repeat(filled)}</Text>
      <Text color="#333">{'-'.repeat(empty)}</Text>
    </Text>
  );
}

export function DownloadView({
  width,
  height,
  downloaded,
  skipped,
  failed,
  total,
  currentFile,
  status,
  isComplete,
  stats,
  spinIdx,
}: DownloadViewProps) {
  const spinner = SPINNERS[spinIdx % SPINNERS.length];
  const innerWidth = Math.min(width - 4, 80);
  const progress = total > 0 ? Math.min(1, (downloaded + skipped + failed) / total) : 0;
  const pct = Math.round(progress * 100);

  if (isComplete && stats) {
    const sizeStr = formatSize(stats.totalSize);

    return (
      <Box
        flexDirection="column"
        alignItems="center"
        width={width}
        justifyContent="center"
      >
        <Box flexDirection="column" alignItems="center">
          {LOGO.map((line, i) => (
            <Text key={i} color={ACCENT} bold>
              {line}
            </Text>
          ))}
        </Box>

        <Box marginTop={2} flexDirection="column" alignItems="center" width={innerWidth}>
          <Text color="#a0a0a0">
            {'  '}project{'     '}
            <Text color="white">{stats.projectName}</Text>
          </Text>
          <Text color="#a0a0a0">
            {'  '}output{'     '}
            <Text color="white">{stats.outputDir}</Text>
          </Text>
          <Box marginTop={1} />
          <Text color="#a0a0a0">
            {'  '}pulled{'    '}
            <Text color="#4ec9b0">{stats.downloaded}</Text>
          </Text>
          <Text color="#a0a0a0">
            {'  '}skipped{'    '}
            <Text color="#dcdcaa">{stats.skipped}</Text>
          </Text>
          <Text color="#a0a0a0">
            {'  '}size{'       '}
            <Text color="white">{sizeStr}</Text>
          </Text>
        </Box>

        <Box marginTop={2}>
          <Text color="#707070">
            {'  '}press <Text color="white">esc</Text> or <Text color="white">^c</Text> to exit
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      flexDirection="column"
      alignItems="center"
      width={width}
      justifyContent="center"
    >
      <Box flexDirection="column" alignItems="center" width={innerWidth}>
        <Box marginTop={0}>
          <Text color="white" bold>  pulling source files</Text>
        </Box>

        <Box marginTop={1} flexDirection="column" width={innerWidth}>
          <Text color="#a0a0a0">
            <Text color={ACCENT}>{spinner}</Text> {status}
          </Text>
        </Box>

        <Box marginTop={1} width={innerWidth} flexDirection="column">
          <Box justifyContent="space-between">
            <Text color="#a0a0a0">  progress</Text>
            <Text color="white" bold>{pct}%</Text>
          </Box>
          <Box marginTop={0}>
            <Text>  </Text>
            <ProgressBar progress={progress} width={innerWidth - 4} />
          </Box>
        </Box>

        <Box marginTop={1} width={innerWidth} flexDirection="column">
          <Text color="#a0a0a0">
            {'  '}<Text color="#4ec9b0">v</Text> caught{'       '}
            <Text color="white" bold>{String(downloaded).padStart(4)}</Text>
            {'    '}
            <Text color="#dcdcaa">&gt;</Text> skipped{'     '}
            <Text color="white" bold>{String(skipped).padStart(4)}</Text>
            {'    '}
            <Text color="#f44747">x</Text> failed{'      '}
            <Text color="white" bold>{String(failed).padStart(4)}</Text>
            {'    '}
            <Text color="#707070">of</Text>{' '}
            <Text color="white">{total}</Text>
          </Text>
        </Box>

        {currentFile && (
          <Box marginTop={1} width={innerWidth}>
            <Text color="#555">
              {'  '}{currentFile.length > innerWidth - 4
                ? '...' + currentFile.slice(-(innerWidth - 7))
                : currentFile}
            </Text>
          </Box>
        )}

        <Box marginTop={1}>
          <Text color="#555">
            {'  '}press <Text color="#707070">esc</Text> to cancel
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
