import { type ComponentProps } from "solid-js"

const mark = (props: { class?: string }) => (<svg data-component="logo-mark" classList={{ [props.class ?? ""]: !!props.class }} viewBox="25 22 78 86" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="#acacac" d="m33 41 31 14v28L33 69Z"/><path fill="#d3d3d3" d="m64 55 31-14v28L64 83Z"/><path fill="#f4f4f4" d="m64 27 31 14-31 14-31-14Z"/><path fill="#848484" d="m45 78 19 8v17L45 94Z"/><path fill="#a8a8a8" d="m64 86 19-8v16l-19 9Z"/><path fill="#cecece" d="m64 69 19 9-19 8-19-8Z"/></svg>)

const splash = (props: Pick<ComponentProps<"svg">, "ref" | "class">) => (<svg ref={props.ref} data-component="logo-splash" classList={{ [props.class ?? ""]: !!props.class }} viewBox="25 22 78 86" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="#acacac" d="m33 41 31 14v28L33 69Z"/><path fill="#d3d3d3" d="m64 55 31-14v28L64 83Z"/><path fill="#f4f4f4" d="m64 27 31 14-31 14-31-14Z"/><path fill="#848484" d="m45 78 19 8v17L45 94Z"/><path fill="#a8a8a8" d="m64 86 19-8v16l-19 9Z"/><path fill="#cecece" d="m64 69 19 9-19 8-19-8Z"/></svg>)

const logo = (props: { class?: string }) => (<svg data-component="logo" classList={{ [props.class ?? ""]: !!props.class }} viewBox="25 22 78 86" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="#acacac" d="m33 41 31 14v28L33 69Z"/><path fill="#d3d3d3" d="m64 55 31-14v28L64 83Z"/><path fill="#f4f4f4" d="m64 27 31 14-31 14-31-14Z"/><path fill="#848484" d="m45 78 19 8v17L45 94Z"/><path fill="#a8a8a8" d="m64 86 19-8v16l-19 9Z"/><path fill="#cecece" d="m64 69 19 9-19 8-19-8Z"/></svg>)

export { mark as Mark, splash as Splash, logo as Logo }
