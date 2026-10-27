class PcmCapture extends AudioWorkletProcessor {
 constructor(){super();this.samples=new Float32Array(512);this.offset=0;}
 process(inputs){const input=inputs[0]?.[0];if(input)for(const value of input){this.samples[this.offset++]=value;if(this.offset===this.samples.length){this.port.postMessage(this.samples.slice());this.offset=0;}}return true;}
}
registerProcessor('pcm-capture',PcmCapture);
