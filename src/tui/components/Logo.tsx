import React from 'react';
import { Box, Text } from 'ink';

export const LOGO: string[] = [
  '  ____  _   _ _     _     ',
  ' |  _ \\| | | | |   | |    ',
  ' | |_) | | | | |   | |    ',
  ' |  __/| |_| | |___| |___ ',
  ' |_|    \\___/|_____|_____|',
];

export const LOGO_SMALL: string[] = [
  '+---------------------------+',
  '|          P U L L          |',
  '+---------------------------+',
];

export function Logo({ width }: { width: number }) {
  if (width >= 35) {
    return (
      <Box flexDirection="column" alignItems="center">
        {LOGO.map((line, i) => (
          <Text key={i} color="#7f9db5" bold>
            {line}
          </Text>
        ))}
      </Box>
    );
  }
  return (
    <Box flexDirection="column" alignItems="center">
      {LOGO_SMALL.map((line, i) => (
        <Text key={i} color="#7f9db5" bold>
          {line}
        </Text>
      ))}
    </Box>
  );
}
