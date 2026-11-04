// Converte áudio nativo do navegador (44,1/48 kHz no iPhone) para PCM 16 kHz.
class PcmCapture extends AudioWorkletProcessor {
  constructor(){
    super();
    this.samples=new Float32Array(512);this.offset=0;
    this.inputRate=(typeof sampleRate==='number' && sampleRate>0)?sampleRate:16000;
    this.step=this.inputRate/16000;this.next=0;this.position=0;this.previous=0;
  }
  emit(value){
    this.samples[this.offset++]=value;
    if(this.offset===this.samples.length){this.port.postMessage(this.samples.slice());this.offset=0;}
  }
  process(inputs){
    const input=inputs[0]?.[0];
    if(!input)return true;
    for(const value of input){
      const index=this.position++;
      if(index===0)this.previous=value;
      while(this.next<=index){
        const fraction=Math.max(0,Math.min(1,this.next-(index-1)));
        this.emit(this.previous+(value-this.previous)*fraction);
        this.next+=this.step;
      }
      this.previous=value;
    }
    return true;
  }
}
registerProcessor('pcm-capture',PcmCapture);
