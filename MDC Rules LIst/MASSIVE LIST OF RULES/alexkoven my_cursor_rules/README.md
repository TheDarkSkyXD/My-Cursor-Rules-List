This repository contains prompt rules for the coding agent in Cursor.

My typical workflow consists of the following steps:
1. Plan the codebase development using an advanced reasoning LLM.
2. Once the high-level plan is complete, use `plan_creation.mdc` in Cursor to generate a detailed, step-by-step coding plan.
3. The step-by-step plan is then executed by the Cursor agent using `plan_execution.mdc`.

The remaining rules are used for debugging and for controlling general coding behavior.

I used the following references to create the rules:
- [This GitHub post](https://gist.github.com/aashari/07cc9c1b6c0debbeb4f4d94a3a81339e)
- [This](https://x.com/ryancarson/status/1877170052492824683?s=46) and [this](https://x.com/kregenrek/status/1887574910501105793) Twitter post

Setting up the cursor rules in a new codebase (called `new_codebase` here) is quite easy:
1. I create a `.cursor` folder in the `new_codebase` along with `git init` in `new_codebase`. Inside the `.cursor` folder, I run the bash script. Note that the bash script will be located at the original `my_cursor_rules` repo.
2. The bash script clones the `my_cursor_rules` into the `.cursor` folder. This will lead to nested git repos, which is not good practice but the only reasonable way to manage cursor rules across many repos. Since the bash script automatically puts the `.cursor` folder into the `.gitignore` of the parent git, the parent git will ignore the `.cursor` folder. This setup will allow you to pull and push the `my_cursor_rules` from the different repos you are working on.
