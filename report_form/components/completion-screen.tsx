import React from 'react';
import { Button } from "@/components/ui/button";

const CompletionScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold mb-4">フォームの送信が完了しました！</h1>
      <Button variant="outline" onClick={() => window.location.href = '/'}>
        入力画面に戻る
      </Button>
    </div>
  );
};

export default CompletionScreen;
