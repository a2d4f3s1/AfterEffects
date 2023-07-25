// JSONファイルへのパスを取得
var scriptFile = new File($.fileName);
var scriptPath = scriptFile.path;
var listFilePath = scriptPath + "/CoOpener_List.json";

// 外部のJSONファイルから配列を読み込む
var listFile = new File(listFilePath);
listFile.open('r');
var listData = JSON.parse(listFile.read());
listFile.close();

// "設定1"という名前の配列を読み込む
var compNames = listData["設定1"];

// コンポジションを開くか閉じるかを制御するフラグ
var compClose = false;

// "閉じる(C)" のメニューコマンドIDを取得する
var closeID = app.findMenuCommandId("閉じる(C)");

// 閉じるコマンドが有効なものであるか確認する
if (closeID <= 0) {
    alert('"閉じる(C)" は適切なMenuCommandではありません');
    throw new Error('"閉じる(C)" は適切なMenuCommandではありません');
}

// 配列を逆順にする
// compNames.reverse();

// 処理本体（対象のコンポを開く/閉じる）
for (var j = 0; j < compNames.length; j++) {
    for (var i = 1; i <= app.project.numItems; i++) {
        if (app.project.item(i) instanceof CompItem) {
            if (app.project.item(i).name == compNames[j]) {
                app.project.item(i).openInViewer();
                if (compClose) {
                    app.executeCommand(closeID);
                }
                break;
            }
        }
    }
}
