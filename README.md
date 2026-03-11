说明：摇杆方式，使用摇杆移动角色和射击，武器方向朝向触摸屏幕的位置；键盘方式，鼠标右键控制角色移动，鼠标左键控制武器朝向和射击<br>

<br>
项目结构：<br>
ademo/<br>
├── assets/<br>
│   ├── resources/        # 资源目录<br>
│   │   ├── audio/        # 音频资源（BGM、射击、爆炸）<br>
│   │   ├── prefab/       # 预制体（角色、武器、子弹、UI等）<br>
│   │   └── texture/      # 纹理资源<br>
│   ├── scenes/           # 场景文件<br>
│   │   ├── start.scene   # 开始场景<br>
│   │   └── battle.scene  # 战斗场景<br>
│   └── scripts/          # 脚本目录<br>
│       ├── Base/         # 基类（单例、状态机、实体管理器）<br>
│       ├── Common/       # 通用（枚举、状态、工具）<br>
│       ├── Entity/       # 实体（角色、子弹、武器、爆炸）<br>
│       ├── Global/       # 全局管理器<br>
│       ├── Scenes/       # 场景管理器<br>
│       └── UI/           # UI管理器
