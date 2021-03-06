import {Mooc} from "../factory";
import {Hook, Context} from "@App/internal/utils/hook";
import {createBtn, substrex, protocolPrompt} from "@App/internal/utils/utils";
import "../../views/common";
import {CourseTopic, CourseQueryAnswer} from "./question";
import {
    ToolsQuestionBankFacade,
    ToolsQuestionBank,
    QuestionBank,
    QuestionBankFacade,
    Answer,
    Option,
    PushAnswer,
    QuestionStatusString
} from "@App/internal/app/question";
import {Application} from "@App/internal/application";

export class Course163 implements Mooc {

    public Start(): void {
        this.hook();
    }

    protected hook() {
        let self = this;
        let hookXMLHttpRequest = new Hook("open", Application.GlobalContext.XMLHttpRequest.prototype);
        hookXMLHttpRequest.Middleware(function (next: Context, ...args: any) {
            if (args[1].indexOf("CourseBean.getLessonUnitLearnVo.dwr") > 0 ||
                args[1].indexOf("MocQuizBean.getQuizPaperDto.dwr") > 0) {
                Object.defineProperty(this, "responseText", {
                    get: function () {
                        if (this.response.indexOf("paper:s0") > 0) {
                            self.collectAnswer(this.response);
                            setTimeout(() => {
                                self.courseTopic()
                            }, 1000);
                        } else if (this.response.indexOf("tname:\"") > 0) {
                            if (this.response.indexOf("answers:s0") > 0) {
                                self.collectAnswer(this.response);
                            }
                            setTimeout(() => {
                                self.examTopic()
                            }, 1000);
                        }
                        return this.response;
                    }
                });
            }
            return next.apply(this, args);
        });
    }

    protected examTopic() {
        if (document.querySelector("#exam-tools-search")) {
            return;
        }
        //TODO: 优化
        let search = createBtn("搜索答案", "点击搜索答案", "cx-btn mooc163-search", "exam-tools-search");
        let divel = document.querySelector(".u-learn-moduletitle");
        let topic = new CourseTopic(document, new ToolsQuestionBankFacade("mooc163", {
            refer: document.URL,
            id: document.URL.match(/\?id=(.*?)($|&)/)[1],
        }));
        topic.SetQueryQuestions(new CourseQueryAnswer());
        search.onclick = async function () {
            protocolPrompt("你正准备使用中国慕课的答题功能,相应的我们需要你的正确答案,同意之后插件将自动检索你的所有答案\n* 本项选择不会影响你的正常使用(协议当前版本有效)\n* 手动点击答题结果页面自动采集页面答案\n", "course_answer_collect", "我同意");

            search.innerText = "搜索中...";
            let ret = await topic.QueryAnswer();
            search.innerText = QuestionStatusString(ret);
        }
        divel.insertBefore(search, divel.firstChild);
    }

    //TODO:优化
    protected collectAnswer(str: string) {
        let script = str.match(/^([\s\S]+?)dwr.engine._remoteHandleCallback/)[1];
        if (document.URL.indexOf("quizscore?id=") > 0) {
            script = "function a(){" + script + ";return s1;}a();";
        } else {
            script = "function a(){" + script + ";return s0;}a();";
        }
        let ret = eval(script);
        let u = document.URL.match(/(\?id|cid)=(.*?)($|&)/);
        if (u.length <= 0) {
            return;
        }
        let bank = new ToolsQuestionBank("mooc163", {
            refer: document.URL,
            id: u[2],
        });
        let answer = new Array<Answer>();
        let options: Array<any>;
        options = ret.objectiveQList;
        if (options == undefined) {
            options = ret;
        }
        if (options == undefined) {
            return
        }
        //TODO:优化,太难看了
        for (let i = 0; i < options.length; i++) {
            let topic = options[i];
            if (topic.type != 1 && topic.type != 2) {
                if (topic.type == 3) {
                    let tmpAnswer = new PushAnswer();
                    tmpAnswer.topic = topic.title;
                    tmpAnswer.type = 4;
                    tmpAnswer.correct = new Array<Option>();
                    if (!topic.stdAnswer) {
                        continue;
                    }
                    tmpAnswer.correct.push({
                        option: "一", content: topic.stdAnswer,
                    });
                    answer.push(tmpAnswer);
                } else if (topic.type == 4) {
                    let tmpAnswer = new PushAnswer();
                    tmpAnswer.topic = topic.title;
                    tmpAnswer.type = 3;
                    tmpAnswer.correct = new Array<Option>();
                    if (!topic.optionDtos) {
                        continue;
                    }
                    for (let n = 0; n < topic.optionDtos.length; n++) {
                        if (topic.optionDtos[n].answer) {
                            tmpAnswer.correct.push({
                                option: "正确" == topic.optionDtos[n].content,
                                content: "正确" == topic.optionDtos[n].content,
                            });
                            break;
                        }
                    }
                    answer.push(tmpAnswer);
                }
                continue;
            }
            if (!topic.optionDtos) {
                continue;
            }
            let option = new Array<Option>();
            let correct = new Array<Option>();
            let tmpAnswer = new PushAnswer();
            tmpAnswer.topic = topic.title;
            tmpAnswer.type = topic.type;
            for (let i = 0; i < topic.optionDtos.length; i++) {
                let opt = {content: topic.optionDtos[i].content, option: String.fromCharCode(65 + i)};
                if (topic.optionDtos[i].answer) {
                    correct.push(opt);
                }
                option.push(opt);
            }
            tmpAnswer.correct = correct;
            tmpAnswer.answers = option;
            answer.push(tmpAnswer);
        }
        bank.Push(answer);
    }

    protected courseTopic() {
        if (document.querySelector("#tools-search")) {
            return;
        }
        let search = createBtn("搜索答案", "点击搜索答案", "cx-btn mooc163-search", "tools-search");
        let divel = document.querySelector(".m-learnunitUI");

        let topic = new CourseTopic(document, new ToolsQuestionBankFacade("mooc163", {
            refer: document.URL,
            id: document.URL.match(/cid=(.*?)($|&)/)[1],
        }));
        topic.SetQueryQuestions(new CourseQueryAnswer());
        search.onclick = async function () {
            search.innerText = "搜索中...";
            search.innerText = await topic.QueryAnswer();
            search.innerText = "搜索答案";
        }
        divel.insertBefore(search, divel.firstChild);
    }

}