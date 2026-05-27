<template>
  <view class="qp">
    <view class="ts"><view class="ta" :class="{a:at==='bank'}" @click="at='bank'">📚 题库</view><view class="ta" :class="{a:at==='review'}" @click="at='review'">📝 复盘</view></view>

    <view v-show="at==='bank'">
      <view class="cc" v-for="cat in groupedQuestions" :key="cat.name">
        <view class="ch" @click="toggle(cat.name)">
          <text class="cn">{{cat.name}}</text><text class="cco">{{cat.questions.length}}题</text><text class="ei">{{exp.includes(cat.name)?'▼':'▶'}}</text>
        </view>
        <view v-if="exp.includes(cat.name)" class="ql">
          <view class="qi" v-for="(q,i) in cat.questions" :key="q.id" @click="toggleAnswer(q)">
            <text class="qt">{{i+1}}. {{q.title}}</text>
            <view v-if="q.open" class="qa">
              <text class="qat" v-if="q.content">{{q.content}}</text>
              <text class="qat no" v-else>暂无解析，请自己思考哦～</text>
            </view>
          </view>
        </view>
      </view>
      <view v-if="!groupedQuestions.length" class="es"><text class="eem">题库加载中...</text></view>
    </view>

    <view v-show="at==='review'">
      <view v-if="!reviews.length" class="es"><text class="ei2">📝</text><text class="et">还没有面试记录</text><button class="gb" @click="goInt">开始面试</button></view>
      <view class="rv" v-for="r in reviews" :key="r.id" @click="goD(r)">
        <view class="rh"><text class="rt">{{tl(r.interviewType)}}</text><text class="rd">{{fd(r.createdAt)}}</text></view>
        <text class="rp">{{r.targetPosition}}</text>
        <view class="rf"><text class="rs" :class="sc(r.score)">{{r.score}}分</text><text class="ra">›</text></view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import api from '@/api/request';

const at = ref('bank');
const exp = ref([]);
const reviews = ref([]);
const questions = ref([]);
const groupedQuestions = ref([]);

function toggle(n){ const i=exp.value.indexOf(n); i===-1?exp.value.push(n):exp.value.splice(i,1); }
function tl(t){ return {tech:'技术',hr:'HR',pressure:'压力'}[t]||t; }
function sc(s){ return s>=80?'h':s>=60?'m':'l'; }
function fd(d){ return d?d.slice(0,10):''; }
function goInt(){ uni.navigateTo({url:'/pages/interview/index'}); }
function goD(r){ uni.navigateTo({url:`/pages/question/detail?sessionId=${r.sessionId}`}); }
function toggleAnswer(q){
  q.open = !q.open;
}

// 从 API 获取题库并按分类分组
async function fetchQuestions() {
  try {
    questions.value = await api.get('/questions/list');
    // 按 category 分组
    const map = {};
    questions.value.forEach(q => {
      if (!map[q.category]) map[q.category] = [];
      map[q.category].push(q);
    });
    groupedQuestions.value = Object.keys(map).map(cat => ({
      name: cat,
      questions: map[cat]
    }));
  } catch {
    groupedQuestions.value = [];
  }
}

async function fetchReviews() {
  try { reviews.value = await api.get('/interview/history/1'); } catch { reviews.value = []; }
}

onMounted(async () => {
  await fetchQuestions();
  await fetchReviews();
});

onShow(async () => {
  await fetchReviews();
});
</script>

<style lang="scss" scoped>
.qp { padding:16px; padding-bottom:80px; }
.ts { display:flex; background:#fff; border-radius:10px; overflow:hidden; margin-bottom:16px; }
.ta { flex:1; text-align:center; padding:14px 0; font-size:14px; color:#666; }
.ta.a { color:#4A90D9; border-bottom:2px solid #4A90D9; background:#f0f7ff; }
.cc { background:#fff; border-radius:12px; margin-bottom:12px; overflow:hidden; }
.ch { display:flex; align-items:center; padding:16px; }
.cn { flex:1; font-size:15px; font-weight:600; }
.cco { font-size:12px; color:#999; margin-right:10px; }
.ei { color:#ccc; font-size:12px; }
.ql { padding:0 16px 16px; }
.qi { padding:12px 0; border-top:1px solid #f0f0f0; }
.qt { font-size:14px; color:#333; line-height:1.6; }
.qd { font-size:12px; color:#999; display:block; margin-top:4px; }
.qa { background:#f9fafc; border-radius:8px; padding:12px; margin-top:8px; }
.qat { font-size:13px; color:#666; line-height:1.6; white-space:pre-wrap; }
.qat.no { color:#bbb; font-style:italic; }
.eem { font-size:14px; color:#ccc; }
.es { text-align:center; padding:60px 20px; }
.ei2 { font-size:48px; display:block; }
.et { font-size:16px; color:#666; display:block; margin:12px 0; }
.gb { margin-top:20px; background:#4A90D9; color:#fff; border:none; border-radius:20px; padding:10px 30px; font-size:14px; }
.rv { background:#fff; border-radius:12px; padding:16px; margin-bottom:10px; }
.rh { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
.rt { background:#f0f7ff; color:#4A90D9; font-size:12px; padding:2px 8px; border-radius:4px; }
.rd { font-size:12px; color:#bbb; }
.rp { font-size:15px; font-weight:500; display:block; margin-bottom:10px; }
.rf { display:flex; justify-content:space-between; align-items:center; }
.rs { font-size:18px; font-weight:700; }
.ra { font-size:20px; color:#ccc; }
.h { color:#52C41A; } .m { color:#FAAD14; } .l { color:#FF4D4F; }
</style>
