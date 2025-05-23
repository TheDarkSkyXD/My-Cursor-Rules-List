# What Are Cursor AI rules
Cursor Rules are configuration files that define how AI should interact
with your codebase. They provide context-aware assistance by setting
guidelines, constraints, and behavioral patterns for AI interactions.

Cursor now lets you create multiple .cursor rule files instead of a
single, monolithic file. Put your files in the hidden .cursor/rules
folder as individual markdown files (with a .mdc extension). 
This separation lets you build separate rules for different focus
areas, such as: code-generation, prd, assistance-style, rules for
.ts files, or anything you want Cursor to know.

# How to use this Drupal Cursor AI rules
1- Create the hidden directory .cursor/rules if it doesn't exist

2- Add the drupal-cursor-rules.mdc file to that directory

3- You can check that rules are captured by Cursor AI by going to 
Cursor -> Settings -> Cusor Settings -> Rules
There you will see the rules where added to the project rules.
