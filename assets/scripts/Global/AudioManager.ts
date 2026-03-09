import { AudioClip, AudioSource, _decorator, Node, resources } from "cc";
import Singleton from "../Base/Singleton";
import SettingsManager from "./SettingsManager";
import { AudioPathEnum } from "../Common/Enum";

const { ccclass } = _decorator;

@ccclass("AudioManager")
export default class AudioManager extends Singleton {
  static get Instance() {
    return super.GetInstance<AudioManager>();
  }

  private audioSourceMap: Map<string, AudioSource> = new Map();
  private audioClipMap: Map<string, AudioClip> = new Map();
  private bgmAudioSource: AudioSource | null = null;
  private rootNode: Node | null = null;

  init(rootNode: Node) {
    this.cleanup();
    this.rootNode = rootNode;
    this.createBGMAudioSource();
  }

  private cleanup() {
    this.audioSourceMap.clear();
    this.bgmAudioSource = null;
  }

  private createBGMAudioSource() {
    if (!this.rootNode) return;
    
    const bgmNode = new Node("BGMAudio");
    bgmNode.setParent(this.rootNode);
    this.bgmAudioSource = bgmNode.addComponent(AudioSource);
    this.bgmAudioSource.loop = true;
  }

  async loadAllAudioClips(): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const key in AudioPathEnum) {
      const path = AudioPathEnum[key as keyof typeof AudioPathEnum];
      promises.push(this.loadAudioClip(path));
    }

    await Promise.all(promises);
  }

  private loadAudioClip(path: string): Promise<void> {
    return new Promise((resolve) => {
      resources.load(path, AudioClip, (err, clip) => {
        if (err) {
          console.error(`Failed to load audio clip: ${path}`, err);
          resolve();
          return;
        }
        this.audioClipMap.set(path, clip);
        resolve();
      });
    });
  }

  playBGM() {
    const bgmClip = this.audioClipMap.get(AudioPathEnum.BGM);
    if (this.bgmAudioSource && bgmClip) {
      try {
        this.bgmAudioSource.clip = bgmClip;
        this.bgmAudioSource.volume = SettingsManager.Instance.musicVolume;
        this.bgmAudioSource.play();
      } catch (e) {
        console.warn("Failed to play BGM:", e);
      }
    }
  }

  stopBGM() {
    if (this.bgmAudioSource) {
      try {
        this.bgmAudioSource.stop();
      } catch (e) {
        console.warn("Failed to stop BGM:", e);
      }
    }
  }

  playSFX(audioPath: string) {
    const clip = this.audioClipMap.get(audioPath);
    if (!clip) return;

    try {
      const audioSource = this.getOrCreateAudioSource(audioPath);
      if (audioSource) {
        audioSource.clip = clip;
        audioSource.volume = SettingsManager.Instance.soundVolume;
        audioSource.play();
      }
    } catch (e) {
      console.warn("Failed to play SFX:", e);
    }
  }

  private getOrCreateAudioSource(path: string): AudioSource | null {
    if (!this.rootNode) return null;

    let audioSource = this.audioSourceMap.get(path);
    
    if (audioSource && (!audioSource.node || !audioSource.node.isValid)) {
      this.audioSourceMap.delete(path);
      audioSource = null;
    }
    
    if (!audioSource) {
      const node = new Node(`Audio_${path}`);
      node.setParent(this.rootNode);
      audioSource = node.addComponent(AudioSource);
      audioSource.loop = false;
      this.audioSourceMap.set(path, audioSource);
    }
    return audioSource;
  }

  updateMusicVolume() {
    if (this.bgmAudioSource) {
      try {
        this.bgmAudioSource.volume = SettingsManager.Instance.musicVolume;
      } catch (e) {
        console.warn("Failed to update music volume:", e);
      }
    }
  }

  updateSoundVolume() {
    this.audioSourceMap.forEach((audioSource, path) => {
      try {
        if (audioSource.node && audioSource.node.isValid) {
          audioSource.volume = SettingsManager.Instance.soundVolume;
        } else {
          this.audioSourceMap.delete(path);
        }
      } catch (e) {
        console.warn("Failed to update sound volume:", e);
      }
    });
  }
}
