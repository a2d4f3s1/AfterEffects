# Composite Opener
タイムラインのコンポの表示非表示を一括で切り替えを行うツールです  
jsonを利用し、管理を簡単にしています  

リリース：
https://github.com/a2d4f3s1/AfterEffects/releases/tag/CompositeOpener

https://github.com/a2d4f3s1/AfterEffects/assets/49066959/7153d85f-414a-483e-9b06-b47307d47fbe

---
> 以下は「※ Read Me（Listファイルの書き方）.txt」との内容とほぼ同じです

Read Me (23/07/19 update)  

インストール  
■ CompositeOpener フォルダは「C:\Program Files\」は避けて配置して下さい(書き込みエラーになります)  
■ AEの[環境設定][スクリプトとエクスプレッション][スクリプトによるファイルへの書き込み]をONにして下さい  
■ ランチャー等を利用する場合「CompositeOpener_exe.jsx」のみそちらにコピーして下さい  

---
1．「CompositeOpener_exe.jsx」について
 
『CompositeOpener_exe.jsx』は「C:\Program Files\」のエラー回避用です  
ランチャーの登録等にはこちらを利用して下さい  
`var scriptFile = new File("/f/500_Github/AfterEffects_Private/CompositeOpener/21_edit/CompositeOpener.jsx");`  
を転送先のパスに変更して下さい  

---
2．「CompositeOpener_setting.json」について 

「CompositeOpener_setting.json」にパスが書かれていますが…初期は動くはずです  
動かない時に確認して下さい  
"listPath": "CoOpener_List.json",  

※ パスがエラーの場合本体パスの再検索は自動で行います  
※ バックスラッシュの数が違うとエラーになります  
誤：`"listPath": "F:\500_Github\AfterEffects_Private\CompositeOpener\21_edit\CoOpener_List.json",`  
正：`"listPath": "F:\\500_Github\\AfterEffects_Private\\CompositeOpener\\21_edit\\CoOpener_List.json",`  

---
3．「CoOpener_List.json」について 

例：CoOpener_List.json
```
{
    "numOfRows": 5,
    "patterns": {
        "最終,コンポ /d2,コンポC": ["最終_.._.*_.*", "コンポ \\d{2}", "コンポC"],
        "コンポ 2,コンポ /d{3}": ["コンポ 2", "コンポ \\d{3}"],
        "aaa,bbb,ccc": ["aaa", "bbb", "ccc"]
    }  
}
```
※ "numOfRows"リストを読み込み直した時の初期のリストの数  

※ "patterns"の名前は正規表現に引っかからなければOK。分かりやすい名前を付けます  

※ リストの中身は一部の正規表現が使えます  
.	：任意の1文字。「..」なら2文字。「.」の数で特定の文字数に設定できる  
.*	：任意の文字。文字数を制限しない  
\\d{2}	：2桁の数字  
\\d{3}	：3桁の数字  

書き方の例  
「作品名_話数_カット番号_テイク等」  
↓  
「作品名_01_c234_v01」や「作品名_01_c234A_t01」のパターンが考えられる場合  
↓  
「作品名_\\d{2}_c.*_.*」こんな感じ  

