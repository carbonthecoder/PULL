import {execFileSync} from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

let windowsHelperChecked = false
let windowsHelperPath: string | null = null

function getWindowsHelper(): string | null {
  if (windowsHelperChecked) return windowsHelperPath
  windowsHelperChecked = true

  if (process.platform !== 'win32') return null

  const helperExe = path.join(os.tmpdir(), 'grab-clipget.exe')
  if (fs.existsSync(helperExe)) {
    windowsHelperPath = helperExe
    return helperExe
  }

  const cscCandidates = [
    'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe',
    'C:\\Windows\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe',
  ]
  const csc = cscCandidates.find(p => fs.existsSync(p))
  if (csc) {
    try {
      const csSource = path.join(os.tmpdir(), 'grab-clipget.cs')
      const code =
        'using System;using System.Windows.Forms;class P{[STAThread]static void Main(){if(Clipboard.ContainsText())Console.Write(Clipboard.GetText());}}'
      fs.writeFileSync(csSource, code, 'utf8')
      execFileSync(
        csc,
        ['/nologo', '/optimize', '/target:exe', `/out:${helperExe}`, '/reference:System.Windows.Forms.dll', csSource],
        {timeout: 5000, stdio: 'ignore'},
      )
      if (fs.existsSync(helperExe)) {
        windowsHelperPath = helperExe
        return helperExe
      }
    } catch {
      // fallback to powershell
    }
  }

  return null
}

const COMMANDS: Array<() => [string, string[], number]> =
  process.platform === 'darwin'
    ? [() => ['pbpaste', [], 1000]]
    : process.platform === 'win32'
      ? [
          () => {
            const helper = getWindowsHelper()
            if (helper) return [helper, [], 2000]
            return [
              'powershell.exe',
              ['-NoLogo', '-NoProfile', '-NonInteractive', '-InputFormat', 'None', '-Command', 'Get-Clipboard'],
              4000,
            ]
          },
          () => [
            'powershell.exe',
            ['-NoLogo', '-NoProfile', '-NonInteractive', '-InputFormat', 'None', '-Command', 'Get-Clipboard'],
            4000,
          ],
          () => [
            'powershell',
            ['-NoLogo', '-NoProfile', '-NonInteractive', '-InputFormat', 'None', '-Command', 'Get-Clipboard'],
            4000,
          ],
        ]
      : [
          () => ['wl-paste', ['--no-newline'], 1000],
          () => ['xclip', ['-selection', 'clipboard', '-o'], 1000],
          () => ['xsel', ['--clipboard', '--output'], 1000],
        ]

export function readClipboard(): string {
  for (const getCmd of COMMANDS) {
    try {
      const [command, args, timeout] = getCmd()
      const output = execFileSync(command, args, {encoding: 'utf8', timeout, stdio: ['ignore', 'pipe', 'ignore']})
      if (typeof output === 'string') return output
    } catch {
      // next
    }
  }
  return ''
}
