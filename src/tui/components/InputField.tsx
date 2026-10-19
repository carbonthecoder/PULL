import React, { useState, useEffect, useRef } from 'react';
import { Box, Text } from 'ink';

interface InputFieldProps {
  label: string;
  value: string;
  cursorIndex: number;
  isFocused: boolean;
  width: number;
  masked?: boolean;
  placeholder?: string;
  error?: boolean;
}

export function InputField({
  label,
  value,
  cursorIndex,
  isFocused,
  width,
  masked = false,
  placeholder = '',
  error = false,
}: InputFieldProps) {
  const [cursorVisible, setCursorVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isFocused) {
      setCursorVisible(false);
      return;
    }
    setCursorVisible(true);
    timerRef.current = setInterval(() => setCursorVisible((v) => !v), 530);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isFocused]);

  const innerWidth = width - 2;
  const borderColor = error ? '#f44747' : isFocused ? '#7f9db5' : '#444';
  const promptColor = error ? '#f44747' : isFocused ? '#7f9db5' : '#555';

  const displayValue = masked ? '*'.repeat(value.length) : value;
  const maxVisible = innerWidth - 4;
  const shown =
    displayValue.length > maxVisible
      ? displayValue.slice(-(maxVisible))
      : displayValue;

  const topBorder =
    `╭─ ${label} ` + '─'.repeat(Math.max(0, innerWidth - label.length - 4)) + '╮';
  const bottomBorder = '╰' + '─'.repeat(innerWidth - 2) + '╯';

  const prompt = '› ';
  const promptLen = prompt.length;

  const cursorPos = Math.min(cursorIndex, shown.length);
  const before = shown.slice(0, cursorPos);
  const atChar = cursorPos < shown.length ? shown[cursorPos] : ' ';
  const after = cursorPos < shown.length ? shown.slice(cursorPos + 1) : '';

  const showPlaceholder = value.length === 0 && !isFocused;
  const placeholderText = showPlaceholder
    ? placeholder.slice(0, maxVisible - promptLen)
    : '';

  const padding = Math.max(
    0,
    innerWidth - promptLen - shown.length - 3
  );

  return (
    <Box flexDirection="column" width={width}>
      <Text color={borderColor}>{topBorder}</Text>
      <Box>
        <Text color={borderColor}>│</Text>
        <Text color={borderColor}> </Text>
        <Text color={promptColor} bold>{prompt}</Text>
        {showPlaceholder ? (
          <Text color="#444">{placeholderText}</Text>
        ) : (
          <>
            <Text color="white">{before}</Text>
            {isFocused && cursorVisible ? (
              <Text inverse color="white">
                {atChar}
              </Text>
            ) : (
              <Text color={error ? '#f44747' : 'white'}>{atChar}</Text>
            )}
            <Text color={error ? '#f44747' : 'white'}>{after}</Text>
          </>
        )}
        <Text color={borderColor}>
          {' '.repeat(padding)}│
        </Text>
      </Box>
      <Text color={borderColor}>{bottomBorder}</Text>
    </Box>
  );
}
