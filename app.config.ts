import { accordion } from '@nuxt/ui/dist/runtime/ui.config'

export default defineAppConfig({
  ui: {
    primary: 'green',
    gray: 'slate',
    tooltip: {
      background: '!bg-background',
    },
    variables: {
      dark: {
        background: 'var(--color-gray-950)',
      },
      header: {
        height: '5rem',
      },
    },
    icons: {
      dark: 'i-ph-moon-duotone',
      light: 'i-ph-sun-duotone',
      search: 'i-ph-magnifying-glass-duotone',
      external: 'i-ph-arrow-up-right',
      chevron: 'i-ph-caret-down',
      hash: 'i-ph-hash-duotone',
    },
    header: {
      wrapper: 'lg:mb-0 lg:border-0',
      popover: {
        links: {
          active: 'dark:bg-gray-950/50',
          inactive: 'dark:hover:bg-gray-950/50',
        },
      },
    },
    accordion: {
      wrapper: 'w-full flex flex-col',
      container: 'w-full flex flex-col',
      item: {
        base: '',
        size: 'text-sm',
        color: 'text-gray-900 dark:text-gray-100',
        icon: 'ms-auto transform transition-transform duration-200 flex-shrink-0',
      },
      transition: {
        enterActiveClass:
          'overflow-hidden transition-[height] duration-200 ease-out',
        leaveActiveClass:
          'overflow-hidden transition-[height] duration-200 ease-out',
      },
      default: {
        openIcon: 'i-heroicons-chevron-down-20-solid',
        closeIcon: '',
        class: 'mb-1.5 w-full',
        variant: 'soft',
        truncate: true,
      },
    },
    card: {
      wrapper: 'bg-dark dark:bg-gray-900',
      background: 'bg-gray-100 dark:bg-gray-900',
    },
  },
})
