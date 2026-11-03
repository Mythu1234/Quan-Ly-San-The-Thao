import {useEffect,useId,useLayoutEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {Check,ChevronDown,Search} from 'lucide-react';

interface Option {value:string;label:string;group?:string;detail?:string}
interface Props {id:string;value:string;options:Option[];placeholder:string;searchPlaceholder:string;searchable?:boolean;compact?:boolean;disabled?:boolean;onChange:(value:string)=>void}
const normalize=(text:string)=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase();

export default function IncidentSelect({id,value,options,placeholder,searchPlaceholder,searchable=true,compact=false,disabled,onChange}:Props){
 const [open,setOpen]=useState(false),[query,setQuery]=useState(''),[active,setActive]=useState(-1);
 const [position,setPosition]=useState({top:0,left:0,width:320,maxHeight:320});
 const trigger=useRef<HTMLButtonElement>(null),panel=useRef<HTMLDivElement>(null),search=useRef<HTMLInputElement>(null);
 const listId=useId();
 const selected=options.find(option=>option.value===value);
 const filtered=options.filter(option=>normalize(`${option.label} ${option.group||''}`).includes(normalize(query)));
 const close=(restore=false)=>{setOpen(false);if(restore)trigger.current?.focus();};
 const choose=(option:Option)=>{onChange(option.value);close(true);};
 useLayoutEffect(()=>{
  if(!open)return;
  const positionPanel=()=>{
   const rect=trigger.current!.getBoundingClientRect(),viewport=window.visualViewport;
   const height=viewport?.height||window.innerHeight,width=viewport?.width||window.innerWidth;
   const below=height-rect.bottom-12,above=rect.top-12;
   const maxHeight=Math.min(340,Math.max(150,below>=200||below>=above?below:above));
   const panelWidth=Math.min(rect.width,width-24);
   setPosition({top:below>=200||below>=above?rect.bottom+6:Math.max(8,rect.top-maxHeight-6),left:Math.max(12,Math.min(rect.left,width-panelWidth-12)),width:panelWidth,maxHeight});
  };
  positionPanel();(search.current||panel.current)?.focus();
  window.addEventListener('resize',positionPanel);window.addEventListener('scroll',positionPanel,true);
  return()=>{window.removeEventListener('resize',positionPanel);window.removeEventListener('scroll',positionPanel,true);};
 },[open]);
 useEffect(()=>{
  if(!open)return;
  const outside=(event:Event)=>{if(!panel.current?.contains(event.target as Node)&&!trigger.current?.contains(event.target as Node))setOpen(false);};
  document.addEventListener('pointerdown',outside);document.addEventListener('focusin',outside);
  return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('focusin',outside);};
 },[open]);
 useEffect(()=>{if(open&&active>=0)document.getElementById(`${listId}-${active}`)?.scrollIntoView({block:'nearest'});},[active,open,listId]);
 return <>
  <button id={id} ref={trigger} type="button" disabled={disabled} aria-haspopup="listbox" aria-expanded={open} aria-controls={open?listId:undefined}
   onClick={()=>{setQuery('');setActive(-1);setOpen(!open);}}
   onKeyDown={event=>{if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();setQuery('');setActive(0);setOpen(true);}}}
   className={`flex w-full min-w-0 items-center justify-between gap-2 border text-left text-xs transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 disabled:opacity-60 ${compact?'min-h-9 rounded-lg px-2.5 py-1.5':'min-h-11 rounded-xl px-3 py-2'} ${open?'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/10':'border-slate-200 bg-slate-50/60 hover:border-emerald-300 hover:bg-white'}`}>
   <span className="min-w-0"><span className={`block truncate ${selected?'font-semibold text-slate-900':'text-slate-500'}`}>{selected?.label||placeholder}</span>{!compact&&selected?.detail&&<span className="mt-0.5 block text-[10px] font-semibold text-emerald-700">{selected.detail}</span>}</span>
   <ChevronDown className={`h-4 w-4 shrink-0 text-emerald-700 transition-transform ${open?'rotate-180':''}`}/>
  </button>
  {open&&!disabled&&createPortal(<div ref={panel} tabIndex={-1} style={position} className="fixed z-[250] flex flex-col overflow-hidden rounded-2xl border border-emerald-100 bg-white outline-none shadow-[0_12px_40px_-8px_rgba(15,23,42,0.25)]"
   onKeyDown={event=>{
    if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close(true);}
    if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();setActive(index=>event.key==='ArrowDown'?Math.min(index+1,filtered.length-1):Math.max(index-1,0));}
    if(event.key==='Enter'){event.preventDefault();if(filtered[active])choose(filtered[active]);}
   }}>
   {searchable&&<div className="shrink-0 border-b border-slate-100 p-2.5"><div className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5"><Search className="h-3.5 w-3.5 shrink-0 text-slate-400"/><input ref={search} role="combobox" aria-label={searchPlaceholder} aria-expanded="true" aria-controls={listId} aria-autocomplete="list" aria-activedescendant={active>=0?`${listId}-${active}`:undefined} value={query} onChange={event=>{setQuery(event.target.value);setActive(-1);}} placeholder={searchPlaceholder} className="min-w-0 w-full bg-transparent py-2 text-xs text-slate-900 outline-none placeholder:text-slate-400"/></div></div>}
   <div id={listId} role="listbox" aria-labelledby={id} className="min-h-0 overflow-y-auto overscroll-contain p-1.5 custom-scrollbar">
    {filtered.length===0&&<p className="px-3 py-5 text-center text-xs text-slate-500">Không tìm thấy kết quả.</p>}
    {filtered.map((option,index)=><div key={option.value}>
     {option.group&&option.group!==filtered[index-1]?.group&&<div className="px-3 pb-1 pt-2.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">{option.group}</div>}
     <button id={`${listId}-${index}`} type="button" role="option" aria-selected={value===option.value} tabIndex={-1} onPointerMove={()=>setActive(index)} onClick={()=>choose(option)} className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-xs transition ${value===option.value?'bg-emerald-50 text-emerald-900':active===index?'bg-slate-50 text-slate-900':'text-slate-700 hover:bg-slate-50'}`}>
      <span className="min-w-0"><span className="block font-medium leading-snug">{option.label}</span>{option.detail&&<span className="mt-1 block text-[10px] font-semibold text-emerald-700">{option.detail}</span>}</span>
      {value===option.value&&<Check className="h-4 w-4 shrink-0 text-emerald-600"/>}
     </button>
    </div>)}
   </div>
   <div className="shrink-0 border-t border-slate-100 px-3 py-1.5 text-[10px] text-slate-400">{filtered.length} lựa chọn</div>
  </div>,document.body)}
 </>;
}
