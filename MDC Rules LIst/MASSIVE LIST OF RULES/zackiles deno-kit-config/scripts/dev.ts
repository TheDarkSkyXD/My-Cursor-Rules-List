#!/usr/bin/env -S deno run -A --watch

const command = new Deno.Command('deno', {
  args: ['run', '-A', '--watch', '../src/mod.ts'],
})

await command.output()
