# milinks-alfred

An Alfred workflow for working with MiLinks.

## Core capabilities

Still very much work in progress. Here's a mapping of capabilities considered "core" and what is left to be implemented.

|Capability|Implemented|
|-|-|
|Read file|✅|
|Resolve local link group references|✅|
|Resolve remote link group references|✅|
|Fuzzy-find through links|✅|
|Open in browser for a selected link|✅|
|Copy to clipboard for a selected link|✅|
|Ability to navigate step-by-step through full link tree|✅|
|Ability to search through full link tree|✅|
|CRUD for individual links|❌|
|CRUD for link groups|❌|
|CRUD for link group references|❌|

## Nice-to-have

|Capability|Implemented|
|-|-|
|Pre-fetching of remote data|❌|
|Caching of remote data|❌|


## Development

1. `npm install`
1. Point Alfred to the [`alfred-workflow`](./alfred-workflow) directory
1. Make a change to code in [`src`](./src) directory
1. Run `npm run build` to re-build the filter-script used by the workflow
1. Trigger the workflow in alfred (default keyword is `milinks`)
