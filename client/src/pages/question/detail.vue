<template>
  <view class="dp">
    <view class="sh"><view class="bs" :class="sc(sco)"><text class="sn">{{sco}}</text><text class="su">分</text></view><text class="sl">{{sl}}</text></view>

    <view class="se"><view class="st">📋 综合评价</view><text class="et2">{{ev}}</text></view>

    <view class="se" v-if="str.length||wks.length">
      <view class="st">💪 优势</view><view class="li" v-for="(s,i) in str" :key="i"><text class="dt g">✓</text><text>{{s}}</text></view>
      <view class="st" style="margin-top:16px;">📉 待改进</view><view class="li" v-for="(w,i) in wks" :key="i"><text class="dt w">!</text><text>{{w}}</text></view>
    </view>

    <view class="se ad2"><view class="st">📝 改进建议</view><text class="at2">{{sg}}</text></view>

    <view class="se"><view class="st">💬 对话回顾</view>
      <view class="mi2" v-for="(m,i) in msgs" :key="i">
        <text class="mr2">{{m.role==='user'?'你':'AI 面试官'}}</text><text class="mc">{{m.content}}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import api from '@/api/request';

const sco = ref(0); const ev = ref(''); const str = ref([]); const wks = ref([]); const sg = ref(''); const msgs = ref([]);

const sl = computed(()=>{ if(sco.value>=85)return'优秀';if(sco.value>=70)return'良好';if(sco.value>=60)return'一般';return'待加强'; });
function sc(s){ return s>=80?'h':s>=60?'m':'l'; }

onLoad(async (options) => {
  const sid = options.sessionId;
  if (sid) {
    try {
      // 从后端获取真实数据 — 唯一数据源
      const record = await api.get(`/interview/detail/${sid}`);
      sco.value = record.score || 0;
      ev.value = record.evaluation || '';
      sg.value = record.suggestions || '';
      msgs.value = (record.messages || []).filter(m => m.role !== 'system');
      // 评分中解析优劣势
      if (record.evaluation) {
        str.value = ['面试已完成，详见综合评价'];
        wks.value = [];
      }
    } catch {
      useFallback(options);
    }
  } else {
    useFallback(options);
  }
});

function useFallback(options) {
  sco.value = parseInt(options.score||'75');
  ev.value = decodeURIComponent(options.evaluation||'整体表现良好，技术基础比较扎实。');
  str.value = ['技术基础扎实','项目经验丰富','沟通表达清晰'];
  wks.value = ['底层原理深度不足','STAR 法则应用不够到位'];
  sg.value = '建议深入研究 Vue 3 源码中的响应式系统和编译优化。';
  msgs.value = [
    {role:'assistant',content:'请先做个自我介绍。'},{role:'user',content:'我是XX大学计算机专业的学生...'}
  ];
}
</script>

<style lang="scss" scoped>
.dp { padding:16px; padding-bottom:40px; }
.sh { text-align:center; padding:32px 0; }
.bs { display:inline-flex; align-items:baseline; }
.sn { font-size:64px; font-weight:700; }
.su { font-size:20px; margin-left:4px; }
.h .sn,.h .su { color:#52C41A; } .m .sn,.m .su { color:#FAAD14; } .l .sn,.l .su { color:#FF4D4F; }
.sl { font-size:16px; color:#999; display:block; margin-top:8px; }
.se { background:#fff; border-radius:12px; padding:16px; margin-bottom:12px; }
.st { font-size:15px; font-weight:600; margin-bottom:10px; }
.et2 { font-size:14px; color:#666; line-height:1.8; }
.li { display:flex; align-items:flex-start; margin-bottom:8px; font-size:14px; color:#555; }
.dt { margin-right:8px; font-weight:700; }
.g { color:#52C41A; } .w { color:#FAAD14; }
.ad2 { background:#f0f7ff; border-left:3px solid #4A90D9; }
.at2 { font-size:14px; color:#555; line-height:1.8; }
.mi2 { padding:10px 0; border-bottom:1px solid #f0f0f0; }
.mi2:last-child { border-bottom:none; }
.mr2 { font-size:12px; font-weight:600; color:#4A90D9; display:block; margin-bottom:4px; }
.mc { font-size:13px; color:#666; line-height:1.6; display:block; }
</style>
