export const modules = [
  { id: 'research', name: '科研', english: 'Research', mark: 'R', description: '把文献、数据与研究表达，变成更顺手的工作流。', count: '12+' },
  { id: 'office', name: '办公', english: 'Office', mark: 'O', description: '从表格整理到汇报写作，让重复工作更轻。', count: '12+' },
  { id: 'vibe-coding', name: 'Vibe Coding', english: 'Build', mark: 'V', description: '用 AI 更快地构思、构建、调试和交付软件。', count: '12+' },
  { id: 'aigc', name: 'AIGC', english: 'Create', mark: 'C', description: '探索图像、视频与声音的创作方法和工具。', count: '12+' },
] as const

export type ModuleId = (typeof modules)[number]['id']
export type ResourceType = 'Prompt' | 'Skill / 插件' | 'AI 工具' | '软件教程' | 'PPT / Excel / Word 模板' | '数据处理工具' | '开源项目' | '使用案例'
export type Resource = {
  id: string; title: string; module: ModuleId; type: ResourceType; topic: string
  tags: string[]; description: string; useCase: string; howTo: string
  input: string; output: string; saves: number; featured: boolean; published: string
  author: string; content: string
}

type Seed = [string, ResourceType, string, string, string]
const resourceSeeds: Record<ModuleId, Seed[]> = {
  research: [
    ['文献综述结构化提取 Prompt', 'Prompt', '文献阅读', '把多篇论文转成可比较的研究矩阵，减少反复摘录。', '论文综述与研究现状梳理'],
    ['论文方法段落拆解器', 'Prompt', '论文写作', '逐段识别研究设计、样本、变量与统计方法。', '快速理解陌生领域的研究方法'],
    ['Zotero 文献元数据清洗', 'Skill / 插件', '文献管理', '批量检查重复条目、缺失 DOI 与不规范作者字段。', '整理长期积累的文献库'],
    ['Semantic Scholar', 'AI 工具', '文献检索', '沿着引用网络发现相关论文与研究脉络。', '快速拓展检索关键词和相关工作'],
    ['PubMed 高级检索教程', '软件教程', '文献检索', '用字段、布尔逻辑与过滤器构造可复现检索式。', '医学与生命科学系统综述'],
    ['实验数据字典模板', 'PPT / Excel / Word 模板', '实验设计', '统一变量名称、单位、取值范围和缺失值编码。', '多人协作的实验数据采集'],
    ['CSV 缺失值诊断工具', '数据处理工具', '数据分析', '汇总缺失比例、异常值范围和字段类型建议。', '正式统计分析前的数据检查'],
    ['OpenAlex Works API 示例', '开源项目', '文献检索', '使用开放学术图谱进行作者与主题检索。', '搭建轻量级文献计量分析'],
    ['摘要到研究问题的推演', 'Prompt', '研究设计', '从研究对象、缺口和证据链推导可检验问题。', '开题前明确研究问题边界'],
    ['Jupyter 论文复现工作簿', '使用案例', '代码复现', '以数据、参数、结果分层组织复现笔记。', '复查论文图表的生成过程'],
    ['R 统计结果解释助手', 'Prompt', '数据分析', '将模型输出转写为审慎、可核验的结果描述。', '撰写结果段落初稿'],
    ['Quarto 学术报告起步', '软件教程', '论文写作', '从 Markdown 生成包含代码与引用的报告。', '维护可重复运行的分析报告'],
  ],
  office: [
    ['会议纪要行动项提取', 'Prompt', '会议协作', '将讨论记录拆成决策、负责人、截止时间与待确认项。', '会后快速形成可执行纪要'],
    ['Excel 多表字段对齐', 'Prompt', 'Excel', '识别多工作表字段差异并输出合并规则。', '汇总不同部门上报的表格'],
    ['周报压缩与重点提炼', 'Prompt', '写作沟通', '将零散进展整理成结果、风险和下周计划。', '生成清晰的团队周报'],
    ['Power Query 文件夹合并', '软件教程', 'Excel', '将每月同结构文件自动追加到统一数据表。', '减少重复复制粘贴'],
    ['Excel 公式解释器', 'AI 工具', 'Excel', '解释嵌套公式、指出边界情况并给出可读版本。', '维护复杂交接表格'],
    ['简洁汇报 PPT 版式模板', 'PPT / Excel / Word 模板', 'PPT', '提供问题、证据、方案三段式汇报页面。', '制作项目复盘与方案汇报'],
    ['Word 样式批量规范', 'Skill / 插件', 'Word', '快速统一标题层级、编号、目录与图注格式。', '整理长篇报告与制度文件'],
    ['PDF 表格批量提取', '数据处理工具', '文档处理', '将多份报告中的指定表格导出为结构化数据。', '归档财务与调研报告'],
    ['邮件语气与结构改写', 'Prompt', '写作沟通', '按对象与目的调整邮件重点、语气和行动请求。', '撰写跨团队协作邮件'],
    ['PowerPoint 讲稿配套案例', '使用案例', 'PPT', '从现有演示文稿生成逐页讲述提示和过渡句。', '准备客户或管理层汇报'],
    ['批量文件命名清单', '数据处理工具', '文件整理', '根据日期、项目和版本规则预览并整理文件名。', '清理共享盘项目资料'],
    ['Google Sheets 公式库', '开源项目', 'Excel', '常用查找、文本清理和条件统计公式示例集。', '快速复用办公表格公式'],
  ],
  'vibe-coding': [
    ['React 页面需求澄清 Prompt', 'Prompt', '前端开发', '先澄清用户、状态、边界，再生成组件实现计划。', '把模糊需求拆成可验证页面任务'],
    ['TypeScript 错误定位 Skill', 'Skill / 插件', '代码调试', '基于报错位置、类型流和调用方逐层定位问题。', '快速修复复杂类型错误'],
    ['Cursor', 'AI 工具', 'AI 编程', '在编辑器内理解代码库、生成补丁并协助调试。', '小步迭代已有项目'],
    ['Playwright 冒烟测试模板', '开源项目', '自动化测试', '覆盖关键路由、表单提交与基础可访问性断言。', '为快速原型增加回归保护'],
    ['API 契约 Mock 教程', '软件教程', '全栈开发', '用 schema 定义接口形状并驱动前端假数据。', '后端未就绪时并行开发'],
    ['PR 代码审查清单', 'Prompt', '代码审查', '优先检查回归风险、安全边界和缺失测试。', '提交前自查变更质量'],
    ['Next.js 搜索页案例', '使用案例', '前端开发', '实现带查询参数、空结果和加载态的搜索界面。', '构建可分享的搜索体验'],
    ['GitHub Copilot 指令文件', 'Skill / 插件', 'AI 编程', '将项目约定写入持久指令，保持代码生成一致。', '建立团队编码上下文'],
    ['依赖升级风险扫描', 'AI 工具', '工程维护', '归纳变更范围、兼容性影响和需要验证的路径。', '评估框架与依赖升级'],
    ['FastAPI CRUD 起步项目', '开源项目', '后端开发', '包含数据模型、校验、路由和基础测试结构。', '快速验证一个本地服务'],
    ['Figma 到 React 组件映射', 'Prompt', 'UI 实现', '将设计稿拆成可复用组件并标注响应式行为。', '从原型进入前端实现'],
    ['错误复现最小化指南', '软件教程', '代码调试', '把复杂问题缩减为输入、步骤和预期结果。', '提高 AI 辅助 Debug 命中率'],
  ],
  aigc: [
    ['产品静物摄影提示词框架', 'Prompt', '图像生成', '用主体、镜头、材质、布光与背景控制产品画面。', '生成电商概念图和视觉提案'],
    ['分镜脚本转视频镜头表', 'Prompt', '视频生成', '将脚本拆为镜头时长、景别、运动与画面连续性。', '准备短视频生成素材'],
    ['ComfyUI 节点工作流入门', '软件教程', '图像生成', '理解模型、采样、提示词与后处理节点关系。', '搭建可控的本地图像流程'],
    ['品牌视觉参考板整理', '使用案例', '设计工作流', '将品牌关键词映射为色彩、构图和材质参考。', '启动海报与活动视觉探索'],
    ['背景移除与边缘修复', 'AI 工具', '图像处理', '清理复杂发丝、透明物和商品边缘。', '制作透明背景素材'],
    ['Stable Diffusion 提示词助手', 'Skill / 插件', '图像生成', '把自然语言拆为主体、构图、光线与负面约束。', '提高提示词结构的一致性'],
    ['短视频口播转字幕卡', '数据处理工具', '视频制作', '从口播文本切分字幕并输出时间轴草稿。', '快速制作知识类短视频'],
    ['开源字体与图像授权检查', '开源项目', '素材管理', '记录生成素材来源、模型许可和二次使用注意事项。', '维护团队创作资产台账'],
    ['角色一致性设定表', 'PPT / Excel / Word 模板', '角色设计', '固定角色外观、服装、镜头与情绪变化范围。', '连续生成系列插画'],
    ['海报文案层级优化', 'Prompt', '平面设计', '根据传播目标重排标题、副标题、信息与行动提示。', '优化活动宣传海报'],
    ['音频降噪与人声增强', 'AI 工具', '音频制作', '改善远程访谈和口播录音的底噪与清晰度。', '整理播客与课程素材'],
    ['AI 图像色彩校准示例', '使用案例', '图像处理', '比较提示词调整与后期曲线对整体色调的影响。', '统一系列视觉素材'],
  ],
}

const resourceDetails = (seed: Seed, index: number, moduleId: ModuleId): Resource => {
  const [title, type, topic, description, useCase] = seed
  const tagsByTopic: Record<string, string[]> = {
    文献阅读: ['论文阅读', '研究综述'], 论文写作: ['论文写作', '表达优化'], 文献管理: ['Zotero', '文献整理'],
    文献检索: ['检索策略', '学术搜索'], 实验设计: ['数据规范', '协作'], 数据分析: ['数据分析', '可重复'],
    代码复现: ['Python', '可复现研究'], 研究设计: ['研究问题', '开题'],
    Excel: ['表格效率', '公式'], 写作沟通: ['中文写作', '沟通'], 会议协作: ['会议', '协作'],
    PPT: ['演示汇报', '信息设计'], Word: ['文档排版', '效率'], 文档处理: ['PDF', '批处理'],
    文件整理: ['自动化', '文件管理'], 前端开发: ['React', '界面开发'], '代码调试': ['Debug', '工程质量'],
    'AI 编程': ['编码助手', '开发工具'], 自动化测试: ['测试', '质量保障'], 全栈开发: ['接口', '开发流程'],
    代码审查: ['代码质量', '安全'], 后端开发: ['API', '工程实践'], 工程维护: ['依赖管理', '维护'],
    'UI 实现': ['设计还原', '组件化'], 图像生成: ['Prompt', '视觉创作'], 视频生成: ['分镜', '视频'],
    设计工作流: ['品牌设计', '创意'], 图像处理: ['后期处理', '素材'], 视频制作: ['字幕', '剪辑'],
    素材管理: ['版权', '团队协作'], 角色设计: ['角色一致性', '插画'], 平面设计: ['海报', '视觉传达'],
    音频制作: ['音频', '降噪'],
  }
  const id = `${moduleId}-${index + 1}`
  const sample = moduleId === 'research' ? '请比较这三篇论文的研究设计和主要局限。'
    : moduleId === 'office' ? '请把这段会议记录整理成行动项和负责人。'
      : moduleId === 'vibe-coding' ? '请分析这个报错的原因，并给出最小修复补丁。'
        : '请生成一张具有清晰主体、柔和侧光的产品概念图。'
  return {
    id, title, module: moduleId, type, topic, tags: tagsByTopic[topic] ?? [topic, 'AI 应用'],
    description, useCase,
    howTo: `先补充你的具体目标、材料和限制条件，再按「${topic}」的工作场景逐步使用。建议先在小样本上检查结果，并对关键事实进行人工核对。`,
    input: sample,
    output: `按要求提取核心信息，说明依据与不确定之处，并以便于继续编辑的结构返回结果。`,
    saves: [286, 214, 173, 151, 119, 97, 82, 74, 63, 51, 39, 26][(index * 3 + (moduleId === 'research' ? 0 : moduleId === 'office' ? 2 : moduleId === 'vibe-coding' ? 4 : 6)) % 12],
    featured: [0, 3, 6, 9].includes(index),
    published: new Date(Date.UTC(2026, 8, 28 - index * 2)).toISOString(),
    author: ['林知远', '编辑部', '陈以宁', '资源共建者'][index % 4],
    content: `你是一位熟悉${topic}场景的 AI 助手。请基于用户提供的材料完成任务，不要虚构来源或数据。遇到缺失信息时，先明确说明假设与待补充内容。输出应条理清晰、便于核对和继续编辑。`,
  }
}

export const resources: Resource[] = modules.flatMap((module) =>
  resourceSeeds[module.id].map((seed, index) => resourceDetails(seed, index, module.id)),
)
export const resourceTypes: ResourceType[] = ['Prompt', 'Skill / 插件', 'AI 工具', '软件教程', 'PPT / Excel / Word 模板', '数据处理工具', '开源项目', '使用案例']
export const briefTopics = ['AI 行业', '模型发布', 'AI 工具', '科研进展', '办公应用', '编程开发', 'AIGC', '开源项目', '学术论文']
export type Brief = { id: string; date: string; topic: string; title: string; summary: string; source: string; resourceId: string }
export const briefs: Brief[] = [
  { id: 'b1', date: '2026-10-11', topic: '模型发布', title: '新一代推理模型开始进入日常工作流', summary: '多家模型厂商持续改进复杂任务拆解与工具调用能力。评估时建议同时观察回答质量、延迟和可复核性，而非只比较单次演示。', source: '编辑部观察', resourceId: 'vibe-coding-1' },
  { id: 'b2', date: '2026-10-11', topic: '科研进展', title: 'AI 辅助科研的重点转向可复现流程', summary: '研究团队开始把数据清洗、实验记录和分析代码纳入统一的审阅链路。自动生成结论仍需回到原始数据核验。', source: '科研动态', resourceId: 'research-10' },
  { id: 'b3', date: '2026-10-11', topic: '办公应用', title: '表格智能体更擅长处理跨表格的重复任务', summary: '新一轮办公工具将自然语言指令连接到筛选、汇总与图表操作。对敏感表格，先使用脱敏副本验证操作范围。', source: '办公前沿', resourceId: 'office-2' },
  { id: 'b4', date: '2026-10-10', topic: 'AI 行业', title: 'AI 服务开始从单点模型转向组合式工作台', summary: '产品设计更多围绕数据连接、任务编排与权限控制展开，选择方案时应将治理成本纳入评估。', source: '行业观察', resourceId: 'vibe-coding-9' },
  { id: 'b5', date: '2026-10-10', topic: 'AIGC', title: '生成视频的镜头连续性控制继续改善', summary: '创作者通过结构化分镜、固定角色描述与参考画面，获得更稳定的短片结果。镜头表仍是协作与修改的重要底稿。', source: '创作工具雷达', resourceId: 'aigc-2' },
  { id: 'b6', date: '2026-10-09', topic: '编程开发', title: '代码代理开始更重视测试反馈闭环', summary: '开发助手在修改代码后自动运行局部测试的能力逐渐普及。小步提交、明确验收标准仍是降低回归风险的关键。', source: '开发者简报', resourceId: 'vibe-coding-4' },
  { id: 'b7', date: '2026-10-09', topic: '开源项目', title: '开源推理工具补齐本地部署体验', summary: '量化、批处理和模型服务监控工具持续成熟。部署前应检查模型许可、硬件成本和更新策略。', source: '开源雷达', resourceId: 'vibe-coding-10' },
  { id: 'b8', date: '2026-10-08', topic: '学术论文', title: '研究者发布多模态科学文献评测基准', summary: '新的评测关注图表理解、方法复现和引用追踪等综合能力。基准结果有助于比较系统，但不能替代领域专家判断。', source: '论文速读', resourceId: 'research-4' },
  { id: 'b9', date: '2026-10-08', topic: 'AI 工具', title: '会议工具新增跨语言术语表和行动项校验', summary: '纪要产品开始支持领域词汇表和负责人确认流程，减少转写后的人名与专业术语错误。', source: '工具更新', resourceId: 'office-1' },
  { id: 'b10', date: '2026-10-07', topic: '科研进展', title: '开放学术图谱改善跨学科主题发现', summary: '开放引用与作者关系数据可帮助研究者拓展相邻领域文献。批量检索时要记录数据快照与查询条件。', source: '科研动态', resourceId: 'research-8' },
  { id: 'b11', date: '2026-10-06', topic: '办公应用', title: '本地文档问答更强调来源定位', summary: '检索增强办公工具正将页码、段落引用与原文件链接作为基础能力，方便核验摘要结论。', source: '办公前沿', resourceId: 'office-8' },
  { id: 'b12', date: '2026-10-05', topic: 'AIGC', title: '创作团队开始建立生成素材授权台账', summary: '模型、素材来源和使用范围记录正在成为交付流程的一部分，帮助团队在复用与发布时追溯资产。', source: '创作工具雷达', resourceId: 'aigc-8' },
]
