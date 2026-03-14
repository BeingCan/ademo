import { _decorator, Component, director, Label, Node, ProgressBar } from 'cc';
import { SceneEnum } from '../Common/Enum';
const { ccclass, property } = _decorator;

@ccclass('LoadingManager')
export class LoadingManager extends Component {

    // 绑定编辑器中的进度条
    @property(ProgressBar)
    progressBar: ProgressBar = null!;

    // 绑定编辑器中的加载文字
    @property(Label)
    progressLabel: Label = null!;

    onLoad() {
        // 初始化进度
        this.updateProgress(0);
        // 开始预加载下一个场景
        this.preloadTargetScene();
    }

    /**
     * 预加载目标场景
     */
    preloadTargetScene() {
        director.preloadScene(
            SceneEnum.battle,
            // 进度回调：实时更新加载进度
            (completed: number, total: number) => {
                let progress = completed / total;
                this.updateProgress(progress);
            },
            // 完成回调：加载成功/失败
            (err) => {
                if (err) {
                    console.error("场景加载失败：", err);
                    this.progressLabel.string = "加载失败！";
                    return;
                }
                // 加载完成，立即切换场景
                this.progressLabel.string = "加载完成，跳转中...";
                // 延迟0.5秒跳转，提升体验
                this.scheduleOnce(() => {
                    director.loadScene(SceneEnum.battle);
                }, 0.5);
            }
        );
    }

    /**
     * 更新UI进度
     * @param progress 0~1
     */
    updateProgress(progress: number) {
        this.progressBar.progress = progress;
        this.progressLabel.string = `加载中 ${Math.floor(progress * 100)}%`;
    }

   
}


