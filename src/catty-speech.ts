/** Keeps the bubble on the reply currently playing, not the one being generated. */
export class CattySpeechQueue {
 private turn=0;
 private serial=0;
 private texts=new Map<number,string>();
 private audio:Array<{id:number;turn:number}>=[];
 get text(){return this.audio.length?this.texts.get(this.audio[0].turn)||'':''}
 transcript(text:string){this.texts.set(this.turn,(this.texts.get(this.turn)||'')+text)}
 enqueue(){const id=++this.serial;this.audio.push({id,turn:this.turn});return id}
 finish(id:number){this.audio=this.audio.filter(item=>item.id!==id);this.prune()}
 endTurn(){this.turn++;this.prune()}
 reset(){this.turn++;this.audio=[];this.texts.clear()}
 private prune(){const queued=new Set(this.audio.map(item=>item.turn));for(const turn of this.texts.keys())if(turn<this.turn&&!queued.has(turn))this.texts.delete(turn)}
}
