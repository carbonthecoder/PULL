import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { Logo } from './components/Logo.js';
import { InputField } from './components/InputField.js';
import { DownloadView } from './components/DownloadView.js';
import { runDownload, type DownloadStats } from '../download.js';
import { readClipboard } from '../clipboard.js';
import { join } from 'path';

type AppStatus = 'input' | 'downloading' | 'complete' | 'error';
type Field = 'token' | 'deployment';

const SPINNERS = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

export default function App() {
  const { exit } = useApp();
  const [columns, setColumns] = useState(process.stdout.columns || 80);
  const [rows, setRows] = useState(process.stdout.rows || 24);

  const [status, setStatus] = useState<AppStatus>('input');
  const [focusField, setFocusField] = useState<Field>('token');
  const [token, setToken] = useState('');
  const [deployment, setDeployment] = useState('');
  const [tokenCursor, setTokenCursor] = useState(0);
  const [deployCursor, setDeployCursor] = useState(0);
  const [fieldError, setFieldError] = useState<Field | null>(null);

  const [dlDownloaded, setDlDownloaded] = useState(0);
  const [dlSkipped, setDlSkipped] = useState(0);
  const [dlFailed, setDlFailed] = useState(0);
  const [dlTotal, setDlTotal] = useState(0);
  const [dlCurrentFile, setDlCurrentFile] = useState('');
  const [dlStatus, setDlStatus] = useState('connecting...');
  const [dlComplete, setDlComplete] = useState(false);
  const [dlStats, setDlStats] = useState<DownloadStats | null>(null);
  const [spinIdx, setSpinIdx] = useState(0);

  const abortRef = useRef(false);

  useEffect(() => {
    const onResize = () => {
      setColumns(process.stdout.columns || 80);
      setRows(process.stdout.rows || 24);
    };
    process.stdout.on('resize', onResize);
    return () => {
      process.stdout.off('resize', onResize);
    };
  }, []);

  useEffect(() => {
    if (status === 'downloading' || status === 'input') {
      const id = setInterval(
        () => setSpinIdx((i) => (i + 1) % SPINNERS.length),
        80
      );
      return () => clearInterval(id);
    }
  }, [status]);

  const contentWidth =
    columns >= 80
      ? Math.min(84, columns - 6)
      : columns >= 45
        ? columns - 4
        : columns - 2;

  const startDownload = useCallback(() => {
    const t = token.trim();
    const d = deployment.trim() || 'latest';

    if (!t && !d) {
      setFieldError('token');
      setFocusField('token');
      return;
    }
    if (!t) {
      setFieldError('token');
      setFocusField('token');
      return;
    }
    if (!d) {
      setFieldError('deployment');
      setFocusField('deployment');
      return;
    }

    setFieldError(null);
    setStatus('downloading');
    abortRef.current = false;

    const outDir = join(process.cwd(), 'pull');

    runDownload(t, d, outDir, {
      onStatus: (msg) => setDlStatus(msg),
      onFileStart: (_name, total) => {
        setDlTotal(total);
      },
      onFileDone: (kind, _path) => {
        if (abortRef.current) return;
        if (kind === 'downloaded') setDlDownloaded((c) => c + 1);
        else if (kind === 'skipped') setDlSkipped((c) => c + 1);
        else if (kind === 'failed') setDlFailed((c) => c + 1);
      },
      onProgress: (_dl, _sk, _fa, current) => {
        if (!abortRef.current) setDlCurrentFile(current);
      },
      onDone: (stats) => {
        if (abortRef.current) return;
        setDlStats(stats);
        setDlComplete(true);
        setStatus('complete');
      },
      onError: (msg) => {
        if (abortRef.current) return;
        setDlStatus(msg);
        setErrorMessage(msg);
        setStatus('error');
      },
    });
  }, [token, deployment]);

  const [errorMessage, setErrorMessage] = useState('');

  const switchField = useCallback(() => {
    setFocusField((f) => (f === 'token' ? 'deployment' : 'token'));
    setFieldError(null);
  }, []);

  const moveUp = useCallback(() => {
    setFocusField('token');
    setFieldError(null);
  }, []);

  const moveDown = useCallback(() => {
    setFocusField('deployment');
    setFieldError(null);
  }, []);

  const clearCurrentField = useCallback(() => {
    if (focusField === 'token') {
      setToken('');
      setTokenCursor(0);
    } else {
      setDeployment('');
      setDeployCursor(0);
    }
    setFieldError(null);
  }, [focusField]);

  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      abortRef.current = true;
      exit();
      return;
    }

    if (status === 'error') {
      if (key.escape || key.return) {
        setStatus('input');
        setErrorMessage('');
        setFieldError(null);
      }
      return;
    }

    if (status === 'complete') {
      if (key.escape) exit();
      return;
    }

    if (status === 'downloading') {
      if (key.escape) {
        abortRef.current = true;
        setStatus('input');
        setDlDownloaded(0);
        setDlSkipped(0);
        setDlFailed(0);
        setDlTotal(0);
        setDlComplete(false);
        setDlStats(null);
        setDlCurrentFile('');
        setDlStatus('connecting...');
      }
      return;
    }

    // ── input mode ──
    const isToken = focusField === 'token';
    const value = isToken ? token : deployment;
    const cursor = isToken ? tokenCursor : deployCursor;
    const setValue = isToken ? setToken : setDeployment;
    const setCursor = isToken ? setTokenCursor : setDeployCursor;

    // up / down arrows to move between fields
    if (key.upArrow) {
      moveUp();
      return;
    }
    if (key.downArrow) {
      moveDown();
      return;
    }

    // tab to toggle
    if (key.tab) {
      switchField();
      return;
    }

    // enter — validate then act
    if (key.return) {
      if (!token.trim() && !deployment.trim()) {
        setFieldError('token');
        setFocusField('token');
        return;
      }
      if (!token.trim()) {
        setFieldError('token');
        setFocusField('token');
        return;
      }
      if (!deployment.trim()) {
        setFieldError('deployment');
        setFocusField('deployment');
        return;
      }
      startDownload();
      return;
    }

    // escape — clear current field or move focus
    if (key.escape) {
      if (value.length > 0) {
        clearCurrentField();
      } else {
        switchField();
      }
      return;
    }

    // left / right arrows for cursor movement within the field
    if (key.leftArrow) {
      if (cursor > 0) setCursor(cursor - 1);
      return;
    }
    if (key.rightArrow) {
      if (cursor < value.length) setCursor(cursor + 1);
      return;
    }

    // home
    if (input === '\x1b[H' || input === '\x1bOH') {
      setCursor(0);
      return;
    }
    // end
    if (input === '\x1b[F' || input === '\x1bOF') {
      setCursor(value.length);
      return;
    }

    // backspace — cover all terminal variants
    if (key.backspace || input === '\x7f' || input === '\x08' || input === '\b') {
      if (cursor > 0) {
        setValue(value.slice(0, cursor - 1) + value.slice(cursor));
        setCursor(cursor - 1);
        setFieldError(null);
      }
      return;
    }

    // delete
    if (key.delete) {
      if (cursor < value.length) {
        setValue(value.slice(0, cursor) + value.slice(cursor + 1));
        setFieldError(null);
      }
      return;
    }

    // paste (Ctrl+V, Ctrl+Shift+V, \x16)
    if (input === '\x16' || (key.ctrl && (input === 'v' || input === 'V' || (key as any).name === 'v'))) {
      const clip = readClipboard().replace(/[\r\n]/g, '').trim();
      if (clip) {
        setValue(value.slice(0, cursor) + clip + value.slice(cursor));
        setCursor(cursor + clip.length);
        setFieldError(null);
      }
      return;
    }

    // printable characters
    if (input && !key.ctrl && !key.meta && !input.startsWith('\x1b')) {
      const ch = input.replace(/[\r\n]/g, ' ');
      if (ch.length > 0) {
        setValue(value.slice(0, cursor) + ch + value.slice(cursor));
        setCursor(cursor + ch.length);
        setFieldError(null);
      }
    }
  });

  if (status === 'error') {
    return (
      <Box
        width={columns}
        height={rows}
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
      >
        <Logo width={contentWidth} />
        <Box marginTop={1}>
          <Text color="#f44747" bold>
            × download failed
          </Text>
        </Box>
        <Box marginTop={1} width={contentWidth}>
          <Text color="#a0a0a0">
            {'  '}{errorMessage}
          </Text>
        </Box>
        <Box marginTop={2}>
          <Text color="#707070">
            <Text color="white">↵</Text> try again{' '}
            <Text color="#555">·</Text>{' '}
            <Text color="white">^c</Text> quit
          </Text>
        </Box>
      </Box>
    );
  }

  if (status === 'downloading' || status === 'complete') {
    return (
      <Box width={columns} height={rows}>
        <DownloadView
          width={columns}
          height={rows}
          downloaded={dlDownloaded}
          skipped={dlSkipped}
          failed={dlFailed}
          total={dlTotal}
          currentFile={dlCurrentFile}
          status={dlStatus}
          isComplete={dlComplete}
          stats={dlStats}
          spinIdx={spinIdx}
        />
      </Box>
    );
  }

  const isShort = rows < 22;
  const isTiny = rows < 16;

  return (
    <Box
      width={columns}
      height={rows}
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      paddingTop={isShort ? 0 : 2}
    >
      <Logo width={contentWidth} />

      {!isTiny && (
        <Box marginTop={1}>
          <Text color="#a0a0a0">
            download source code from any vercel deployment
          </Text>
        </Box>
      )}

      <Box
        marginTop={isTiny ? 1 : 2}
        flexDirection="column"
        alignItems="center"
        width={contentWidth}
      >
        <InputField
          label="vercel token"
          value={token}
          cursorIndex={tokenCursor}
          isFocused={focusField === 'token'}
          width={contentWidth}
          masked
          placeholder="paste your token from vercel.com/account/tokens"
          error={fieldError === 'token'}
        />

        <Box marginTop={1}>
          <InputField
            label="deployment id or url"
            value={deployment}
            cursorIndex={deployCursor}
            isFocused={focusField === 'deployment'}
            width={contentWidth}
            placeholder="dpl_xxx or vercel.com/scope/project/id/source"
            error={fieldError === 'deployment'}
          />
        </Box>
      </Box>

      <Box marginTop={1} flexDirection="column" alignItems="center">
        {fieldError ? (
          <Text color="#f44747">
            {fieldError === 'token'
              ? '  token is required — get one at vercel.com/account/tokens'
              : '  deployment id is required — paste a dpl_xxx or vercel URL'}
          </Text>
        ) : (
          <Text color="#707070">
            <Text color="white">↑↓</Text> switch fields{' '}
            <Text color="#555">·</Text>{' '}
            <Text color="white">↵</Text> download{' '}
            <Text color="#555">·</Text>{' '}
            <Text color="white">esc</Text> clear{' '}
            <Text color="#555">·</Text>{' '}
            <Text color="white">^c</Text> quit
          </Text>
        )}
      </Box>
    </Box>
  );
}
